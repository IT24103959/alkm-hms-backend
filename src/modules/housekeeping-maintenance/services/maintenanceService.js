const {
  MaintenanceTicket,
  MaintenanceStatus,
} = require("../models/MaintenanceTicket");
const AppError = require("../../../middleware/error.middleware");

class MaintenanceService {
  /**
   * Check if a room has active maintenance (blocks booking)
   */
  async hasActiveMaintenance(roomNumber) {
    const activeTicket = await MaintenanceTicket.findOne({
      roomNumber,
      status: {
        $in: [
          MaintenanceStatus.OPEN,
          MaintenanceStatus.ASSIGNED,
          MaintenanceStatus.IN_PROGRESS,
        ],
      },
    });

    if (activeTicket) {
      return {
        blocked: true,
        reason: `Room has active maintenance: ${activeTicket.issueDescription}`,
        ticketId: activeTicket._id,
      };
    }

    return { blocked: false };
  }

  /**
   * Create a new maintenance ticket
   */
  async create(ticketData) {
    const ticket = await MaintenanceTicket.create(ticketData);
    return await ticket.populate("staff", "username fullName role");
  }

  /**
   * Get all maintenance tickets
   * Filter by staff if user is MAINTENANCE_STAFF
   */
  async findAll(user) {
    const query = {};

    // If user is maintenance staff, only show their tickets
    if (user.role === "MAINTENANCE_STAFF") {
      query.staff = user.id;
    }

    const tickets = await MaintenanceTicket.find(query)
      .populate("staff", "username fullName role")
      .sort({ deadline: 1, priority: -1, createdAt: -1 });

    return tickets;
  }

  /**
   * Get maintenance statistics
   */
  async getStats() {
    const totalTickets = await MaintenanceTicket.countDocuments();
    const openTickets = await MaintenanceTicket.countDocuments({
      status: MaintenanceStatus.OPEN,
    });
    const inProgressTickets = await MaintenanceTicket.countDocuments({
      status: {
        $in: [MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS],
      },
    });
    const resolvedTickets = await MaintenanceTicket.countDocuments({
      status: { $in: [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED] },
    });

    // Overdue tickets
    const now = new Date();
    const overdueTickets = await MaintenanceTicket.countDocuments({
      deadline: { $lt: now },
      status: {
        $nin: [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED],
      },
    });

    // Average resolution time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedTicketsWithTime = await MaintenanceTicket.find({
      resolvedAt: { $exists: true, $ne: null },
      createdAt: { $gte: thirtyDaysAgo },
    });

    let avgResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const timeInHours =
          (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60);
        return sum + timeInHours;
      }, 0);
      avgResolutionTime = totalTime / resolvedTicketsWithTime.length;
    }

    // Recurring issues by facility type
    const recurringIssues = await MaintenanceTicket.aggregate([
      {
        $group: {
          _id: "$facilityType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      overdueTickets,
      avgResolutionTimeHours: avgResolutionTime.toFixed(2),
      recurringIssues,
    };
  }

  /**
   * Get a single maintenance ticket by ID
   */
  async findOne(id) {
    const ticket = await MaintenanceTicket.findById(id).populate(
      "staff",
      "username fullName role",
    );

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404);
    }

    return ticket;
  }

  /**
   * Update a maintenance ticket (Admin/Manager only)
   */
  async update(id, updateData) {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("staff", "username fullName role");

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404);
    }

    return ticket;
  }

  /**
   * Update ticket status (Maintenance staff can update their own tickets)
   */
  async updateStatus(id, status, user) {
    const ticket = await MaintenanceTicket.findById(id);

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404);
    }

    // If maintenance staff, verify they own this ticket
    if (
      user.role === "MAINTENANCE_STAFF" &&
      ticket.staff?.toString() !== user.id
    ) {
      throw new AppError("You can only update your own tickets", 403);
    }

    ticket.status = status;

    // Set resolvedAt when ticket is marked as resolved or closed
    if (
      (status === MaintenanceStatus.RESOLVED ||
        status === MaintenanceStatus.CLOSED) &&
      !ticket.resolvedAt
    ) {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    return await ticket.populate("staff", "username fullName role");
  }

  /**
   * Add resolution notes and parts used (Maintenance staff)
   */
  async addResolutionDetails(id, resolutionData, user) {
    const ticket = await MaintenanceTicket.findById(id);

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404);
    }

    // If maintenance staff, verify they own this ticket
    if (
      user.role === "MAINTENANCE_STAFF" &&
      ticket.staff?.toString() !== user.id
    ) {
      throw new AppError("You can only update your own tickets", 403);
    }

    if (resolutionData.resolutionNotes) {
      ticket.resolutionNotes = resolutionData.resolutionNotes;
    }
    if (resolutionData.partsUsed) {
      ticket.partsUsed = resolutionData.partsUsed;
    }

    await ticket.save();
    return await ticket.populate("staff", "username fullName role");
  }

  /**
   * Delete a maintenance ticket
   */
  async delete(id) {
    const ticket = await MaintenanceTicket.findByIdAndDelete(id);

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404);
    }

    return ticket;
  }
}

module.exports = new MaintenanceService();
