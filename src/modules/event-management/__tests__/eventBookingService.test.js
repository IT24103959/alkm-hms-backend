jest.mock("../models/EventBooking", () => ({
  EventBooking: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
  EventStatus: {
    INQUIRY: "INQUIRY",
    CONFIRMED: "CONFIRMED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  },
  HALL_CAPACITIES: {
    "GRAND BALLROOM": 200,
    "GARDEN PAVILION": 150,
    "CONFERENCE ROOM": 80,
    "MINI HALL": 60,
  },
}));

const { EventBooking } = require("../models/EventBooking");
const AppError = require("../../../middleware/error.middleware");
const eventBookingService = require("../services/eventBookingService");

const makeMockBooking = (overrides = {}) => ({
  _id: "booking-123",
  customerName: "Alice Johnson",
  customerEmail: "alice@example.com",
  customerMobile: "0123456789",
  eventType: "Conference",
  hallName: "GRAND BALLROOM",
  packageName: "Standard",
  eventDateTime: "2026-06-01T10:00:00.000Z",
  endDateTime: "2026-06-01T12:00:00.000Z",
  attendees: 50,
  pricePerHour: 30000,
  pricePerGuest: 0,
  durationHours: 2,
  totalPrice: 60000,
  totalCost: 60000,
  status: "CONFIRMED",
  notes: "Annual conference",
  createdByUsername: "alice",
  ...overrides,
});

const makeFindChain = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("eventBookingService", () => {
  describe("listBookings()", () => {
    it("returns only customer bookings for CUSTOMER role", async () => {
      const bookings = [makeMockBooking(), makeMockBooking({ _id: "booking-456", createdByUsername: "alice" })];
      EventBooking.find.mockReturnValue(makeFindChain(bookings));

      const result = await eventBookingService.listBookings("CUSTOMER", "alice");

      expect(EventBooking.find).toHaveBeenCalledWith({ createdByUsername: "alice" });
      expect(result).toEqual(bookings);
    });

    it("returns all bookings for non-CUSTOMER role", async () => {
      const bookings = [makeMockBooking(), makeMockBooking({ _id: "booking-789", createdByUsername: "bob" })];
      EventBooking.find.mockReturnValue(makeFindChain(bookings));

      const result = await eventBookingService.listBookings("MANAGER", "alice");

      expect(EventBooking.find).toHaveBeenCalledWith();
      expect(result).toEqual(bookings);
    });
  });

  describe("createBooking()", () => {
    it("creates an inquiry booking for a CUSTOMER user", async () => {
      const payload = {
        customerName: "Alice Johnson",
        customerEmail: "alice@example.com",
        customerMobile: "0123456789",
        eventType: "Conference",
        hallName: "GRAND BALLROOM",
        packageName: "Standard",
        eventDateTime: "2026-06-01T10:00:00.000Z",
        endDateTime: "2026-06-01T12:00:00.000Z",
        attendees: 50,
        pricePerHour: 30000,
        notes: "Annual conference",
      };
      const createdBooking = makeMockBooking({ _id: "booking-321", status: "INQUIRY" });
      EventBooking.find.mockResolvedValue([]);
      EventBooking.create.mockResolvedValue(createdBooking);

      const result = await eventBookingService.createBooking(payload, "alice", "CUSTOMER");

      expect(EventBooking.create).toHaveBeenCalledWith(expect.objectContaining({
        createdByUsername: "alice",
        status: "INQUIRY",
      }));
      expect(result).toEqual(createdBooking);
    });

    it("sets createdByUsername for non-CUSTOMER users when missing", async () => {
      const payload = {
        customerName: "Bob Martin",
        customerEmail: "bob@example.com",
        customerMobile: "0987654321",
        eventType: "Birthday",
        hallName: "GARDEN PAVILION",
        packageName: "Premium",
        eventDateTime: "2026-06-05T17:00:00.000Z",
        endDateTime: "2026-06-05T20:00:00.000Z",
        attendees: 80,
        pricePerHour: 30000,
        notes: "Evening event",
      };
      const createdBooking = makeMockBooking({
        _id: "booking-654",
        hallName: "GARDEN PAVILION",
        packageName: "Premium",
        status: "CONFIRMED",
        createdByUsername: "manager",
      });
      EventBooking.find.mockResolvedValue([]);
      EventBooking.create.mockResolvedValue(createdBooking);

      const result = await eventBookingService.createBooking(payload, "manager", "MANAGER");

      expect(EventBooking.create).toHaveBeenCalledWith(expect.objectContaining({
        createdByUsername: "manager",
      }));
      expect(result).toEqual(createdBooking);
    });

    it("rejects invalid booking data with AppError", async () => {
      const payload = {
        customerName: "",
        customerEmail: "invalid-email",
        customerMobile: "123",
        eventType: "",
        hallName: "GRAND BALLROOM",
        packageName: "Standard",
        eventDateTime: "2026-06-01T10:00:00.000Z",
        endDateTime: "2026-06-01T09:00:00.000Z",
        attendees: 0,
        pricePerHour: 0,
      };

      await expect(eventBookingService.createBooking(payload, "alice", "CUSTOMER")).rejects.toThrow(AppError);
    });
  });

  describe("updateBooking()", () => {
    it("updates an existing booking and returns the updated document", async () => {
      const existing = makeMockBooking();
      EventBooking.findById.mockResolvedValue(existing);
      EventBooking.find.mockResolvedValue([]);
      const updated = { ...existing, status: "COMPLETED" };
      EventBooking.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await eventBookingService.updateBooking("booking-123", {
        ...existing,
        status: "COMPLETED",
      });

      expect(EventBooking.findById).toHaveBeenCalledWith("booking-123");
      expect(EventBooking.findByIdAndUpdate).toHaveBeenCalledWith(
        "booking-123",
        expect.objectContaining({ status: "COMPLETED" }),
        { new: true, runValidators: false },
      );
      expect(result).toEqual(updated);
    });

    it("throws AppError 404 when the booking is not found", async () => {
      EventBooking.findById.mockResolvedValue(null);

      await expect(eventBookingService.updateBooking("missing-id", {})).rejects.toMatchObject({
        statusCode: 404,
        message: "Event booking not found",
      });
    });
  });

  describe("deleteBooking()", () => {
    it("deletes an existing booking", async () => {
      const existing = makeMockBooking();
      EventBooking.findById.mockResolvedValue(existing);
      EventBooking.findByIdAndDelete.mockResolvedValue(existing);

      await expect(eventBookingService.deleteBooking("booking-123")).resolves.toBeUndefined();
      expect(EventBooking.findByIdAndDelete).toHaveBeenCalledWith("booking-123");
    });

    it("throws AppError 404 when the booking is not found", async () => {
      EventBooking.findById.mockResolvedValue(null);

      await expect(eventBookingService.deleteBooking("missing-id")).rejects.toMatchObject({
        statusCode: 404,
        message: "Event booking not found",
      });
    });
  });

  describe("getAnalytics()", () => {
    it("calculates event revenue only for confirmed and completed bookings", async () => {
      const rows = [
        makeMockBooking({ _id: "booking-1", status: "INQUIRY", totalPrice: 100 }),
        makeMockBooking({ _id: "booking-2", status: "CONFIRMED", totalPrice: 500 }),
        makeMockBooking({ _id: "booking-3", status: "COMPLETED", totalPrice: 0, totalCost: 700 }),
        makeMockBooking({ _id: "booking-4", status: "CANCELLED", totalPrice: 300 }),
      ];
      EventBooking.find.mockResolvedValue(rows);

      const result = await eventBookingService.getAnalytics();

      expect(result.eventRevenue).toBe(1200);
      expect(result.popularTypes).toEqual([
        { type: "Conference", count: 4 },
      ]);
    });
  });
});
