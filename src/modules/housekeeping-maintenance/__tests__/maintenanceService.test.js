jest.mock("../models/MaintenanceTicket", () => ({
  MaintenanceTicket: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
  MaintenanceStatus: {
    OPEN: "OPEN",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
  },
}));

const {
  MaintenanceTicket,
  MaintenanceStatus,
} = require("../models/MaintenanceTicket");
const AppError = require("../../../middleware/error.middleware");
const maintenanceService = require("../services/maintenanceService");

// Helper: create a mock ticket with save/populate support
const makeMockTicket = (overrides = {}) => ({
  _id: "ticket-123",
  roomNumber: "101",
  facilityType: "AC",
  issueDescription: "AC not cooling",
  status: "OPEN",
  priority: "MEDIUM",
  staff: "staff-123",
  deadline: null,
  resolutionNotes: null,
  partsUsed: null,
  resolvedAt: null,
  save: jest.fn().mockResolvedValue(undefined),
  populate: jest.fn().mockResolvedValue({ _id: "ticket-123", ...overrides }),
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

// ─── hasActiveMaintenance ─────────────────────────────────────────────────────

describe("hasActiveMaintenance()", () => {
  it("returns blocked:true when an active ticket exists", async () => {
    const activeTicket = makeMockTicket({ issueDescription: "Pipe leak" });
    MaintenanceTicket.findOne.mockResolvedValue(activeTicket);

    const result = await maintenanceService.hasActiveMaintenance("101");

    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("Pipe leak");
    expect(result.ticketId).toBe(activeTicket._id);
  });

  it("returns blocked:false when no active ticket exists", async () => {
    MaintenanceTicket.findOne.mockResolvedValue(null);

    const result = await maintenanceService.hasActiveMaintenance("101");

    expect(result).toEqual({ blocked: false });
  });

  it("queries with the correct active statuses", async () => {
    MaintenanceTicket.findOne.mockResolvedValue(null);

    await maintenanceService.hasActiveMaintenance("202");

    expect(MaintenanceTicket.findOne).toHaveBeenCalledWith({
      roomNumber: "202",
      status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
    });
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe("create()", () => {
  it("creates a ticket and returns the populated result", async () => {
    const ticketData = {
      roomNumber: "101",
      facilityType: "AC",
      issueDescription: "AC not cooling",
    };
    const populated = {
      ...ticketData,
      _id: "ticket-123",
      staff: { username: "tech1" },
    };
    const mockTicket = makeMockTicket({
      populate: jest.fn().mockResolvedValue(populated),
    });

    MaintenanceTicket.create.mockResolvedValue(mockTicket);

    const result = await maintenanceService.create(ticketData);

    expect(MaintenanceTicket.create).toHaveBeenCalledWith(ticketData);
    expect(mockTicket.populate).toHaveBeenCalledWith(
      "staff",
      "username fullName role",
    );
    expect(result).toEqual(populated);
  });
});

// ─── findAll ──────────────────────────────────────────────────────────────────

describe("findAll()", () => {
  it("returns all tickets for a MANAGER user (no filter)", async () => {
    const tickets = [makeMockTicket(), makeMockTicket({ _id: "ticket-456" })];
    MaintenanceTicket.find.mockReturnValue(makeFindChain(tickets));

    const result = await maintenanceService.findAll({
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(MaintenanceTicket.find).toHaveBeenCalledWith({});
    expect(result).toEqual(tickets);
  });

  it("filters tickets by staff id for a MAINTENANCE_STAFF user", async () => {
    const tickets = [makeMockTicket({ staff: "ms-1" })];
    MaintenanceTicket.find.mockReturnValue(makeFindChain(tickets));

    const result = await maintenanceService.findAll({
      role: "MAINTENANCE_STAFF",
      id: "ms-1",
    });

    expect(MaintenanceTicket.find).toHaveBeenCalledWith({ staff: "ms-1" });
    expect(result).toEqual(tickets);
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────

describe("getStats()", () => {
  it("returns correct stats when no resolved tickets exist", async () => {
    MaintenanceTicket.countDocuments
      .mockResolvedValueOnce(20) // totalTickets
      .mockResolvedValueOnce(8) // openTickets
      .mockResolvedValueOnce(5) // inProgressTickets
      .mockResolvedValueOnce(6) // resolvedTickets
      .mockResolvedValueOnce(2); // overdueTickets

    MaintenanceTicket.find.mockResolvedValue([]);
    MaintenanceTicket.aggregate.mockResolvedValue([
      { _id: "AC", count: 5 },
      { _id: "PLUMBING", count: 3 },
    ]);

    const result = await maintenanceService.getStats();

    expect(result).toEqual({
      totalTickets: 20,
      openTickets: 8,
      inProgressTickets: 5,
      resolvedTickets: 6,
      overdueTickets: 2,
      avgResolutionTimeHours: "0.00",
      recurringIssues: [
        { _id: "AC", count: 5 },
        { _id: "PLUMBING", count: 3 },
      ],
    });
  });

  it("calculates avgResolutionTimeHours correctly", async () => {
    MaintenanceTicket.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const createdAt = new Date("2026-05-01T08:00:00Z");
    const resolvedAt = new Date("2026-05-01T12:00:00Z"); // 4 hours later
    MaintenanceTicket.find.mockResolvedValue([{ createdAt, resolvedAt }]);
    MaintenanceTicket.aggregate.mockResolvedValue([]);

    const result = await maintenanceService.getStats();

    expect(result.avgResolutionTimeHours).toBe("4.00");
  });
});

// ─── findOne ──────────────────────────────────────────────────────────────────

describe("findOne()", () => {
  it("returns the ticket when found", async () => {
    const ticket = makeMockTicket();
    MaintenanceTicket.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(ticket),
    });

    const result = await maintenanceService.findOne("ticket-123");

    expect(MaintenanceTicket.findById).toHaveBeenCalledWith("ticket-123");
    expect(result).toEqual(ticket);
  });

  it("throws AppError 404 when ticket is not found", async () => {
    MaintenanceTicket.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(maintenanceService.findOne("bad-id")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe("update()", () => {
  it("updates a ticket and returns the populated result", async () => {
    const updated = { _id: "ticket-123", status: "ASSIGNED" };
    MaintenanceTicket.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(updated),
    });

    const result = await maintenanceService.update("ticket-123", {
      status: "ASSIGNED",
    });

    expect(MaintenanceTicket.findByIdAndUpdate).toHaveBeenCalledWith(
      "ticket-123",
      { status: "ASSIGNED" },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(updated);
  });

  it("throws AppError 404 when ticket is not found", async () => {
    MaintenanceTicket.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(maintenanceService.update("bad-id", {})).rejects.toMatchObject(
      { statusCode: 404 },
    );
  });
});

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe("updateStatus()", () => {
  it("updates status for a MANAGER user", async () => {
    const mockTicket = makeMockTicket({ status: "OPEN", staff: "staff-1" });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.updateStatus("ticket-123", "IN_PROGRESS", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTicket.status).toBe("IN_PROGRESS");
    expect(mockTicket.save).toHaveBeenCalled();
  });

  it("sets resolvedAt when status is RESOLVED", async () => {
    const mockTicket = makeMockTicket({
      status: "IN_PROGRESS",
      resolvedAt: null,
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.updateStatus("ticket-123", "RESOLVED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTicket.resolvedAt).toBeInstanceOf(Date);
  });

  it("sets resolvedAt when status is CLOSED", async () => {
    const mockTicket = makeMockTicket({ status: "RESOLVED", resolvedAt: null });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.updateStatus("ticket-123", "CLOSED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTicket.resolvedAt).toBeInstanceOf(Date);
  });

  it("does not overwrite existing resolvedAt", async () => {
    const existingDate = new Date("2026-01-01");
    const mockTicket = makeMockTicket({
      status: "RESOLVED",
      resolvedAt: existingDate,
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.updateStatus("ticket-123", "CLOSED", {
      role: "MANAGER",
      id: "mgr-1",
    });

    expect(mockTicket.resolvedAt).toEqual(existingDate);
  });

  it("throws AppError 403 when MAINTENANCE_STAFF tries to update another staff's ticket", async () => {
    const mockTicket = makeMockTicket({
      staff: { toString: () => "other-staff" },
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await expect(
      maintenanceService.updateStatus("ticket-123", "IN_PROGRESS", {
        role: "MAINTENANCE_STAFF",
        id: "ms-1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows MAINTENANCE_STAFF to update their own ticket", async () => {
    const mockTicket = makeMockTicket({
      staff: { toString: () => "ms-1" },
      resolvedAt: null,
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.updateStatus("ticket-123", "RESOLVED", {
      role: "MAINTENANCE_STAFF",
      id: "ms-1",
    });

    expect(mockTicket.status).toBe("RESOLVED");
    expect(mockTicket.save).toHaveBeenCalled();
  });

  it("throws AppError 404 when ticket not found", async () => {
    MaintenanceTicket.findById.mockResolvedValue(null);

    await expect(
      maintenanceService.updateStatus("bad-id", "RESOLVED", {
        role: "MANAGER",
        id: "mgr-1",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── addResolutionDetails ─────────────────────────────────────────────────────

describe("addResolutionDetails()", () => {
  it("adds resolution notes and parts used", async () => {
    const mockTicket = makeMockTicket({ staff: { toString: () => "ms-1" } });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.addResolutionDetails(
      "ticket-123",
      { resolutionNotes: "Replaced filter", partsUsed: "Filter unit" },
      { role: "MAINTENANCE_STAFF", id: "ms-1" },
    );

    expect(mockTicket.resolutionNotes).toBe("Replaced filter");
    expect(mockTicket.partsUsed).toBe("Filter unit");
    expect(mockTicket.save).toHaveBeenCalled();
  });

  it("only updates provided fields", async () => {
    const mockTicket = makeMockTicket({
      staff: { toString: () => "ms-1" },
      partsUsed: "existing-part",
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await maintenanceService.addResolutionDetails(
      "ticket-123",
      { resolutionNotes: "Fixed" },
      { role: "MAINTENANCE_STAFF", id: "ms-1" },
    );

    expect(mockTicket.resolutionNotes).toBe("Fixed");
    expect(mockTicket.partsUsed).toBe("existing-part"); // unchanged
  });

  it("throws AppError 403 when MAINTENANCE_STAFF tries to update another staff's ticket", async () => {
    const mockTicket = makeMockTicket({
      staff: { toString: () => "other-staff" },
    });
    MaintenanceTicket.findById.mockResolvedValue(mockTicket);

    await expect(
      maintenanceService.addResolutionDetails(
        "ticket-123",
        {},
        { role: "MAINTENANCE_STAFF", id: "ms-1" },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws AppError 404 when ticket not found", async () => {
    MaintenanceTicket.findById.mockResolvedValue(null);

    await expect(
      maintenanceService.addResolutionDetails(
        "bad-id",
        {},
        { role: "MANAGER", id: "mgr-1" },
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe("delete()", () => {
  it("deletes a ticket and returns it", async () => {
    const ticket = makeMockTicket();
    MaintenanceTicket.findByIdAndDelete.mockResolvedValue(ticket);

    const result = await maintenanceService.delete("ticket-123");

    expect(MaintenanceTicket.findByIdAndDelete).toHaveBeenCalledWith(
      "ticket-123",
    );
    expect(result).toEqual(ticket);
  });

  it("throws AppError 404 when ticket not found", async () => {
    MaintenanceTicket.findByIdAndDelete.mockResolvedValue(null);

    await expect(maintenanceService.delete("bad-id")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
