jest.mock("../models/Room", () => ({
    Room: {
        findOne: jest.fn(),
    },
    RoomType: {
        STANDARD: "STANDARD",
        DELUXE: "DELUXE",
        SUITE: "SUITE",
        FAMILY: "FAMILY",
    },
    RoomStatus: {
        AVAILABLE: "AVAILABLE",
        RESERVED: "RESERVED",
        OCCUPIED: "OCCUPIED",
        CLEANING: "CLEANING",
        MAINTENANCE: "MAINTENANCE",
    },
}));

jest.mock("../models/RoomBooking", () => ({
    RoomBooking: {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
    RoomBookingStatus: {
        BOOKED: "BOOKED",
        CHECKED_IN: "CHECKED_IN",
        CANCELLATION_REQUESTED: "CANCELLATION_REQUESTED",
        CHECKED_OUT: "CHECKED_OUT",
        CANCELLED: "CANCELLED",
    },
}));

const roomBookingService = require("../services/roomBookingService");
const { Room } = require("../models/Room");
const { RoomBooking, RoomBookingStatus } = require("../models/RoomBooking");
const AppError = require("../../../middleware/error.middleware");
const { makeRoom, makeBooking } = require("./helpers");

describe("roomBookingService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("create", () => {
        it("creates a booking, calculates amount, and populates the room", async () => {
            const room = makeRoom({ totalRooms: 5, normalPrice: 100, weekendPrice: 150 });
            const createPayload = {
                bookingCustomer: "Jane Doe",
                customerEmail: "jane@example.com",
                roomNumber: room.roomNumber,
                bookedRooms: 2,
                guestCount: 3,
                checkInDate: "2026-05-04T00:00:00.000Z",
                checkOutDate: "2026-05-06T00:00:00.000Z",
            };

            Room.findOne.mockResolvedValue(room);
            RoomBooking.find.mockResolvedValue([]);
            RoomBooking.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue({ bookingSequence: 7 }),
            });
            RoomBooking.create.mockImplementation(async (payload) => ({
                ...payload,
                populate: jest.fn().mockResolvedValue({
                    ...makeBooking({
                        ...payload,
                        amount: 400,
                        bookingSequence: 8,
                        room: {
                            roomNumber: room.roomNumber,
                            roomType: room.roomType,
                            capacity: room.capacity,
                        },
                    }),
                }),
            }));

            const result = await roomBookingService.create(createPayload, { username: "jane" });

            expect(Room.findOne).toHaveBeenCalledWith({ roomNumber: room.roomNumber });
            expect(RoomBooking.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    room: room._id,
                    amount: 400,
                    bookingSequence: 8,
                    createdByUsername: "jane",
                    bookedRooms: 2,
                }),
            );
            expect(result.room.roomNumber).toBe(room.roomNumber);
        });

        it("throws 404 when the room does not exist", async () => {
            Room.findOne.mockResolvedValue(null);

            await expect(
                roomBookingService.create(
                    {
                        roomNumber: "999",
                        checkInDate: "2026-05-04T00:00:00.000Z",
                        checkOutDate: "2026-05-06T00:00:00.000Z",
                    },
                    { username: "jane" },
                ),
            ).rejects.toMatchObject({
                message: "Room 999 not found",
                statusCode: 404,
            });
        });

        it("throws 400 when check-out is not after check-in", async () => {
            Room.findOne.mockResolvedValue(makeRoom());

            await expect(
                roomBookingService.create(
                    {
                        roomNumber: "101",
                        checkInDate: "2026-05-06T00:00:00.000Z",
                        checkOutDate: "2026-05-05T00:00:00.000Z",
                    },
                    { username: "jane" },
                ),
            ).rejects.toMatchObject({
                message: "Check-out date must be after check-in date",
                statusCode: 400,
            });
        });

        it("throws 400 when the room is not available", async () => {
            const room = makeRoom({ totalRooms: 1 });
            Room.findOne.mockResolvedValue(room);
            RoomBooking.find.mockResolvedValue([{ bookedRooms: 1 }]);

            await expect(
                roomBookingService.create(
                    {
                        roomNumber: "101",
                        bookedRooms: 1,
                        checkInDate: "2026-05-04T00:00:00.000Z",
                        checkOutDate: "2026-05-06T00:00:00.000Z",
                    },
                    { username: "jane" },
                ),
            ).rejects.toMatchObject({
                message: "Only 0 room(s) available for the selected dates",
                statusCode: 400,
            });
        });
    });

    describe("findAll and findMine", () => {
        it("returns bookings sorted by newest first", async () => {
            const bookings = [makeBooking()];
            RoomBooking.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(bookings),
                }),
            });

            const result = await roomBookingService.findAll();

            expect(result).toEqual(bookings);
            expect(RoomBooking.find).toHaveBeenCalledWith();
        });

        it("returns bookings for the provided username only", async () => {
            const bookings = [makeBooking({ createdByUsername: "alex" })];
            RoomBooking.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(bookings),
                }),
            });

            const result = await roomBookingService.findMine("alex");

            expect(result).toEqual(bookings);
            expect(RoomBooking.find).toHaveBeenCalledWith({ createdByUsername: "alex" });
        });
    });

    describe("update", () => {
        it("updates a booking and returns the populated document", async () => {
            const updatedBooking = makeBooking({ bookingStatus: RoomBookingStatus.CHECKED_IN });
            RoomBooking.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(updatedBooking),
            });

            const result = await roomBookingService.update("booking-1", { bookingStatus: RoomBookingStatus.CHECKED_IN });

            expect(result).toEqual(updatedBooking);
            expect(RoomBooking.findByIdAndUpdate).toHaveBeenCalledWith("booking-1", { bookingStatus: RoomBookingStatus.CHECKED_IN }, { new: true, runValidators: true });
        });

        it("throws 404 when the booking is missing", async () => {
            RoomBooking.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await expect(roomBookingService.update("missing-id", { bookingStatus: RoomBookingStatus.CHECKED_IN })).rejects.toMatchObject({
                message: "Room booking not found",
                statusCode: 404,
            });
        });
    });

    describe("requestCancellation", () => {
        it("lets the booking owner request cancellation", async () => {
            const booking = makeBooking({
                bookingStatus: RoomBookingStatus.BOOKED,
                createdByUsername: "alex",
            });
            booking.save = jest.fn().mockResolvedValue(booking);
            booking.populate = jest.fn().mockResolvedValue(booking);
            RoomBooking.findById.mockResolvedValue(booking);

            const result = await roomBookingService.requestCancellation("booking-1", { username: "alex" });

            expect(booking.bookingStatus).toBe(RoomBookingStatus.CANCELLATION_REQUESTED);
            expect(booking.save).toHaveBeenCalled();
            expect(result).toBe(booking);
        });

        it("throws 403 when a different user tries to cancel", async () => {
            RoomBooking.findById.mockResolvedValue(makeBooking({ createdByUsername: "alex" }));

            await expect(roomBookingService.requestCancellation("booking-1", { username: "jane" })).rejects.toMatchObject({
                message: "You can only cancel your own bookings",
                statusCode: 403,
            });
        });

        it("throws 400 when the booking is not BOOKED", async () => {
            RoomBooking.findById.mockResolvedValue(makeBooking({ bookingStatus: RoomBookingStatus.CHECKED_IN }));

            await expect(roomBookingService.requestCancellation("booking-1", { username: "jane" })).rejects.toMatchObject({
                message: "Only BOOKED reservations can request cancellation",
                statusCode: 400,
            });
        });
    });

    describe("approveCancellation", () => {
        it("moves a pending cancellation request to cancelled", async () => {
            const booking = makeBooking({ bookingStatus: RoomBookingStatus.CANCELLATION_REQUESTED });
            booking.save = jest.fn().mockResolvedValue(booking);
            booking.populate = jest.fn().mockResolvedValue(booking);
            RoomBooking.findById.mockResolvedValue(booking);

            const result = await roomBookingService.approveCancellation("booking-1");

            expect(booking.bookingStatus).toBe(RoomBookingStatus.CANCELLED);
            expect(result).toBe(booking);
        });

        it("throws 400 when there is no pending cancellation request", async () => {
            RoomBooking.findById.mockResolvedValue(makeBooking({ bookingStatus: RoomBookingStatus.BOOKED }));

            await expect(roomBookingService.approveCancellation("booking-1")).rejects.toMatchObject({
                message: "Booking does not have a pending cancellation request",
                statusCode: 400,
            });
        });

        it("throws 404 when the booking is missing", async () => {
            RoomBooking.findById.mockResolvedValue(null);

            await expect(roomBookingService.approveCancellation("missing-id")).rejects.toMatchObject({
                message: "Room booking not found",
                statusCode: 404,
            });
        });
    });

    describe("checkAvailability", () => {
        it("returns availability details for a room", async () => {
            const room = makeRoom({ totalRooms: 4 });
            Room.findOne.mockResolvedValue(room);
            RoomBooking.find.mockResolvedValue([{ bookedRooms: 1 }, { bookedRooms: 1 }]);

            const result = await roomBookingService.checkAvailability("101", "2026-05-04", "2026-05-06");

            expect(result).toEqual({
                roomNumber: "101",
                checkInDate: "2026-05-04",
                checkOutDate: "2026-05-06",
                available: true,
                remainingRooms: 2,
                totalRooms: 4,
                message: "Room is available",
            });
        });

        it("throws 404 when the room does not exist", async () => {
            Room.findOne.mockResolvedValue(null);

            await expect(roomBookingService.checkAvailability("999", "2026-05-04", "2026-05-06")).rejects.toMatchObject({
                message: "Room 999 not found",
                statusCode: 404,
            });
        });
    });

    describe("delete", () => {
        it("deletes an existing booking", async () => {
            RoomBooking.findByIdAndDelete.mockResolvedValue(makeBooking());

            await expect(roomBookingService.delete("booking-1")).resolves.toBeUndefined();

            expect(RoomBooking.findByIdAndDelete).toHaveBeenCalledWith("booking-1");
        });

        it("throws 404 when the booking is missing", async () => {
            RoomBooking.findByIdAndDelete.mockResolvedValue(null);

            await expect(roomBookingService.delete("missing-id")).rejects.toMatchObject({
                message: "Room booking not found",
                statusCode: 404,
            });
        });
    });
});
