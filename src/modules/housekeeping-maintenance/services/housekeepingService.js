const {
  HousekeepingTask,
  HousekeepingStatus,
} = require("../models/HousekeepingTask");
const AppError = require("../../../middleware/error.middleware");

class HousekeepingService {
  /**
   * Create a new housekeeping task
   */
  async create(taskData) {
    const task = await HousekeepingTask.create(taskData);
    return await task.populate("staff", "username fullName role");
  }

  /**
   * Create a housekeeping task from a room booking
   */
  async createFromBooking(bookingData) {
    const { roomNumber, checkInDate, checkOutDate } = bookingData;

    // Create a cleaning task for pre-check-in
    const task = await HousekeepingTask.create({
      roomNumber,
      roomCondition: "PRE_CHECK_IN",
      taskType: "CLEANING",
      status: HousekeepingStatus.PENDING,
      priority: "HIGH",
      deadline: new Date(checkInDate),
      notes: `Pre-check-in cleaning for booking. Check-in: ${checkInDate}`,
    });

    return await task.populate("staff", "username fullName role");
  }

  /**
   * Get all housekeeping tasks
   * Filter by staff if user is HOUSEKEEPER
   */
  async findAll(user) {
    const query = {};

    // If user is housekeeper, only show their tasks
    if (user.role === "HOUSEKEEPER") {
      query.staff = user.id;
    }

    const tasks = await HousekeepingTask.find(query)
      .populate("staff", "username fullName role")
      .sort({ deadline: 1, priority: -1, createdAt: -1 });

    return tasks;
  }

  /**
   * Get housekeeping statistics
   */
  async getStats() {
    const totalTasks = await HousekeepingTask.countDocuments();
    const pendingTasks = await HousekeepingTask.countDocuments({
      status: HousekeepingStatus.PENDING,
    });
    const inProgressTasks = await HousekeepingTask.countDocuments({
      status: HousekeepingStatus.IN_PROGRESS,
    });
    const completedTasks = await HousekeepingTask.countDocuments({
      status: {
        $in: [HousekeepingStatus.CLEANED, HousekeepingStatus.INSPECTED],
      },
    });

    // Overdue tasks
    const now = new Date();
    const overdueTasks = await HousekeepingTask.countDocuments({
      deadline: { $lt: now },
      status: {
        $nin: [HousekeepingStatus.CLEANED, HousekeepingStatus.INSPECTED],
      },
    });

    // Average completion time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedTasksWithTime = await HousekeepingTask.find({
      completedAt: { $exists: true, $ne: null },
      createdAt: { $gte: thirtyDaysAgo },
    });

    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const timeInHours =
          (task.completedAt - task.createdAt) / (1000 * 60 * 60);
        return sum + timeInHours;
      }, 0);
      avgCompletionTime = totalTime / completedTasksWithTime.length;
    }

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      avgCompletionTimeHours: avgCompletionTime.toFixed(2),
    };
  }

  /**
   * Get a single housekeeping task by ID
   */
  async findOne(id) {
    const task = await HousekeepingTask.findById(id).populate(
      "staff",
      "username fullName role",
    );

    if (!task) {
      throw new AppError("Housekeeping task not found", 404);
    }

    return task;
  }

  /**
   * Update a housekeeping task (Admin/Manager only)
   */
  async update(id, updateData) {
    const task = await HousekeepingTask.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("staff", "username fullName role");

    if (!task) {
      throw new AppError("Housekeeping task not found", 404);
    }

    return task;
  }

  /**
   * Update task status (Housekeeper can update their own tasks)
   */
  async updateStatus(id, status, user) {
    const task = await HousekeepingTask.findById(id);

    if (!task) {
      throw new AppError("Housekeeping task not found", 404);
    }

    // If housekeeper, verify they own this task
    if (user.role === "HOUSEKEEPER" && task.staff?.toString() !== user.id) {
      throw new AppError("You can only update your own tasks", 403);
    }

    task.status = status;

    // Set completedAt when task is marked as cleaned or inspected
    if (
      (status === HousekeepingStatus.CLEANED ||
        status === HousekeepingStatus.INSPECTED) &&
      !task.completedAt
    ) {
      task.completedAt = new Date();
    }

    await task.save();
    return await task.populate("staff", "username fullName role");
  }

  /**
   * Add cleaning notes (Housekeeper)
   */
  async addCleaningNotes(id, notes, user) {
    const task = await HousekeepingTask.findById(id);

    if (!task) {
      throw new AppError("Housekeeping task not found", 404);
    }

    // If housekeeper, verify they own this task
    if (user.role === "HOUSEKEEPER" && task.staff?.toString() !== user.id) {
      throw new AppError("You can only update your own tasks", 403);
    }

    task.cleaningNotes = notes;
    await task.save();

    return await task.populate("staff", "username fullName role");
  }

  /**
   * Delete a housekeeping task
   */
  async delete(id) {
    const task = await HousekeepingTask.findByIdAndDelete(id);

    if (!task) {
      throw new AppError("Housekeeping task not found", 404);
    }

    return task;
  }
}

module.exports = new HousekeepingService();
