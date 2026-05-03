jest.mock("../models/HousekeepingTask", () => ({
  HousekeepingTask: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  HousekeepingStatus: {
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    CLEANED: "CLEANED",
    INSPECTED: "INSPECTED",
  },
}));

const {
  HousekeepingTask,
  HousekeepingStatus,
} = require("../models/HousekeepingTask");
const AppError = require("../../../middleware/error.middleware");
const housekeepingService = require("../services/housekeepingService");

// Helper: create a mock task with save/populate support
const makeMockTask = (overrides = {}) => ({
  _id: "task-123",
  roomNumber: "101",
  roomCondition: "OCCUPIED",
  taskType: "CLEANING",
  status: "PENDING",
  priority: "MEDIUM",
  staff: "staff-123",
  deadline: null,
  notes: null,
  cleaningNotes: null,
  completedAt: null,
  save: jest.fn().mockResolvedValue(undefined),
  populate: jest.fn().mockResolvedValue({ _id: "task-123", ...overrides }),
  ...overrides,
});

const makeFindChain = (result) => ({
  populate: jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue(result),
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── create ──────────────────────────────────────────────────────────────────

describe("create()", () => {
  it("creates a task and returns the populated result", async () => {
    const taskData = {
      roomNumber: "101",
      roomCondition: "OCCUPIED",
      taskType: "CLEANING",
    };
    const populated = {
      ...taskData,
      _id: "task-123",
      staff: { username: "john" },
    };
    const mockTask = makeMockTask({
      populate: jest.fn().mockResolvedValue(populated),
    });

    HousekeepingTask.create.mockResolvedValue(mockTask);

    const result = await housekeepingService.create(taskData);

    expect(HousekeepingTask.create).toHaveBeenCalledWith(taskData);
    expect(mockTask.populate).toHaveBeenCalledWith(
      "staff",
      "username fullName role",
    );
    expect(result).toEqual(populated);
  });
});

// ─── createFromBooking ────────────────────────────────────────────────────────

describe("createFromBooking()", () => {
  it("creates a PRE_CHECK_IN cleaning task from booking data", async () => {
    const bookingData = {
      roomNumber: "202",
      checkInDate: "2026-05-10T12:00:00.000Z",
      checkOutDate: "2026-05-15T12:00:00.000Z",
    };
    const populated = {
      _id: "task-456",
      roomNumber: "202",
      taskType: "CLEANING",
    };
    const mockTask = makeMockTask({
      populate: jest.fn().mockResolvedValue(populated),
    });

    HousekeepingTask.create.mockResolvedValue(mockTask);

    const result = await housekeepingService.createFromBooking(bookingData);

    expect(HousekeepingTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomNumber: "202",
        roomCondition: "PRE_CHECK_IN",
        taskType: "CLEANING",
        status: "PENDING",
        priority: "HIGH",
        deadline: new Date(bookingData.checkInDate),
      }),
    );
    expect(result).toEqual(populated);
  });
});

// ─── findAll ──────────────────────────────────────────────────────────────────

describe("findAll()", () => {
  it("returns all tasks for a MANAGER user (no filter)", async () => {
    const tasks = [makeMockTask(), makeMockTask({ _id: "task-456" })];
    HousekeepingTask.find.mockReturnValue(makeFindChain(tasks));

    const result = await housekeepingService.findAll({
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(HousekeepingTask.find).toHaveBeenCalledWith({});
    expect(result).toEqual(tasks);
  });

  it("filters tasks by staff id for a HOUSEKEEPER user", async () => {
    const tasks = [makeMockTask({ staff: "hk-1" })];
    HousekeepingTask.find.mockReturnValue(makeFindChain(tasks));

    const result = await housekeepingService.findAll({
      role: "HOUSEKEEPER",
      id: "hk-1",
    });

    expect(HousekeepingTask.find).toHaveBeenCalledWith({ staff: "hk-1" });
    expect(result).toEqual(tasks);
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────

describe("getStats()", () => {
  it("returns correct stats when no completed tasks exist", async () => {
    HousekeepingTask.countDocuments
      .mockResolvedValueOnce(10) // totalTasks
      .mockResolvedValueOnce(3) // pendingTasks
      .mockResolvedValueOnce(2) // inProgressTasks
      .mockResolvedValueOnce(4) // completedTasks
      .mockResolvedValueOnce(1); // overdueTasks

    HousekeepingTask.find.mockResolvedValue([]); // no completed tasks with time

    const result = await housekeepingService.getStats();

    expect(result).toEqual({
      totalTasks: 10,
      pendingTasks: 3,
      inProgressTasks: 2,
      completedTasks: 4,
      overdueTasks: 1,
      avgCompletionTimeHours: "0.00",
    });
  });

  it("calculates avgCompletionTimeHours correctly", async () => {
    HousekeepingTask.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const createdAt = new Date("2026-05-01T08:00:00Z");
    const completedAt = new Date("2026-05-01T10:00:00Z"); // 2 hours later
    HousekeepingTask.find.mockResolvedValue([{ createdAt, completedAt }]);

    const result = await housekeepingService.getStats();

    expect(result.avgCompletionTimeHours).toBe("2.00");
  });
});

// ─── findOne ──────────────────────────────────────────────────────────────────

describe("findOne()", () => {
  it("returns the task when found", async () => {
    const task = makeMockTask();
    HousekeepingTask.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(task),
    });

    const result = await housekeepingService.findOne("task-123");

    expect(HousekeepingTask.findById).toHaveBeenCalledWith("task-123");
    expect(result).toEqual(task);
  });

  it("throws AppError 404 when task is not found", async () => {
    HousekeepingTask.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(housekeepingService.findOne("bad-id")).rejects.toThrow(
      AppError,
    );
    await expect(housekeepingService.findOne("bad-id")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe("update()", () => {
  it("updates a task and returns the populated result", async () => {
    const updated = {
      _id: "task-123",
      roomNumber: "303",
      status: "IN_PROGRESS",
    };
    HousekeepingTask.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(updated),
    });

    const result = await housekeepingService.update("task-123", {
      status: "IN_PROGRESS",
    });

    expect(HousekeepingTask.findByIdAndUpdate).toHaveBeenCalledWith(
      "task-123",
      { status: "IN_PROGRESS" },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(updated);
  });

  it("throws AppError 404 when task is not found", async () => {
    HousekeepingTask.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(
      housekeepingService.update("bad-id", {}),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe("updateStatus()", () => {
  it("updates status for a MANAGER user", async () => {
    const mockTask = makeMockTask({ status: "PENDING", staff: "staff-1" });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.updateStatus("task-123", "IN_PROGRESS", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTask.status).toBe("IN_PROGRESS");
    expect(mockTask.save).toHaveBeenCalled();
  });

  it("sets completedAt when status is CLEANED", async () => {
    const mockTask = makeMockTask({ status: "IN_PROGRESS", completedAt: null });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.updateStatus("task-123", "CLEANED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTask.completedAt).toBeInstanceOf(Date);
  });

  it("sets completedAt when status is INSPECTED", async () => {
    const mockTask = makeMockTask({ status: "CLEANED", completedAt: null });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.updateStatus("task-123", "INSPECTED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTask.completedAt).toBeInstanceOf(Date);
  });

  it("does not overwrite existing completedAt", async () => {
    const existingDate = new Date("2026-01-01");
    const mockTask = makeMockTask({
      status: "CLEANED",
      completedAt: existingDate,
    });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.updateStatus("task-123", "INSPECTED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTask.completedAt).toEqual(existingDate);
  });

  it("throws AppError 403 when HOUSEKEEPER tries to update another staff's task", async () => {
    const mockTask = makeMockTask({ staff: { toString: () => "other-staff" } });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await expect(
      housekeepingService.updateStatus("task-123", "CLEANED", {
        role: "HOUSEKEEPER",
        id: "hk-1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows HOUSEKEEPER to update their own task", async () => {
    const mockTask = makeMockTask({
      staff: { toString: () => "hk-1" },
      completedAt: null,
    });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.updateStatus("task-123", "CLEANED", {
      role: "HOUSEKEEPER",
      id: "hk-1",
    });

    expect(mockTask.status).toBe("CLEANED");
    expect(mockTask.save).toHaveBeenCalled();
  });

  it("throws AppError 404 when task not found", async () => {
    HousekeepingTask.findById.mockResolvedValue(null);

    await expect(
      housekeepingService.updateStatus("bad-id", "CLEANED", {
        role: "MANAGER",
        id: "mgr-1",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── addCleaningNotes ─────────────────────────────────────────────────────────

describe("addCleaningNotes()", () => {
  it("adds cleaning notes to the task", async () => {
    const mockTask = makeMockTask({ staff: { toString: () => "hk-1" } });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await housekeepingService.addCleaningNotes(
      "task-123",
      "Cleaned thoroughly",
      { role: "HOUSEKEEPER", id: "hk-1" },
    );

    expect(mockTask.cleaningNotes).toBe("Cleaned thoroughly");
    expect(mockTask.save).toHaveBeenCalled();
  });

  it("throws AppError 403 when HOUSEKEEPER tries to update another staff's task", async () => {
    const mockTask = makeMockTask({ staff: { toString: () => "other-staff" } });
    HousekeepingTask.findById.mockResolvedValue(mockTask);

    await expect(
      housekeepingService.addCleaningNotes("task-123", "notes", {
        role: "HOUSEKEEPER",
        id: "hk-1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws AppError 404 when task not found", async () => {
    HousekeepingTask.findById.mockResolvedValue(null);

    await expect(
      housekeepingService.addCleaningNotes("bad-id", "notes", {
        role: "MANAGER",
        id: "mgr-1",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe("delete()", () => {
  it("deletes a task and returns it", async () => {
    const task = makeMockTask();
    HousekeepingTask.findByIdAndDelete.mockResolvedValue(task);

    const result = await housekeepingService.delete("task-123");

    expect(HousekeepingTask.findByIdAndDelete).toHaveBeenCalledWith("task-123");
    expect(result).toEqual(task);
  });

  it("throws AppError 404 when task not found", async () => {
    HousekeepingTask.findByIdAndDelete.mockResolvedValue(null);

    await expect(housekeepingService.delete("bad-id")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
