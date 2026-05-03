jest.mock("../models/Room", () => ({
    Room: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        find: jest.fn(),
        findByIdAndDelete: jest.fn(),
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
    },
    RoomBookingStatus: {
        BOOKED: "BOOKED",
        CHECKED_IN: "CHECKED_IN",
        CANCELLATION_REQUESTED: "CANCELLATION_REQUESTED",
        CHECKED_OUT: "CHECKED_OUT",
        CANCELLED: "CANCELLED",
    },
}));

const roomService = require("../services/roomService");
const { Room } = require("../models/Room");
const { RoomBooking } = require("../models/RoomBooking");
const AppError = require("../../../middleware/error.middleware");
const { makeRoom } = require("./helpers");

describe("roomService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("create", () => {
        it("creates a room when the room number is unique", async () => {
            const payload = makeRoom({ roomNumber: "101" });
            const createdRoom = { _id: "room-1", ...payload };

            Room.findOne.mockResolvedValue(null);
            Room.create.mockResolvedValue(createdRoom);

            await expect(roomService.create(payload)).resolves.toEqual(createdRoom);

            expect(Room.findOne).toHaveBeenCalledWith({ roomNumber: "101" });
            expect(Room.create).toHaveBeenCalledWith(payload);
        });

        it("throws 400 when the room already exists", async () => {
            Room.findOne.mockResolvedValue(makeRoom({ roomNumber: "101" }));

            await expect(roomService.create({ roomNumber: "101" })).rejects.toMatchObject({
                message: "Room number 101 already exists",
                statusCode: 400,
            });

            expect(Room.create).not.toHaveBeenCalled();
        });
    });

    describe("findAll", () => {
        it("returns mapped rooms when no dates are provided", async () => {
            const room = makeRoom();
            Room.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([room]),
            });

            const result = await roomService.findAll();

            expect(result).toEqual([
                expect.objectContaining({
                    _id: room._id,
                    roomNumber: room.roomNumber,
                    remainingRooms: room.totalRooms,
                }),
            ]);
            expect(RoomBooking.find).not.toHaveBeenCalled();
        });

        it("calculates remaining rooms for date filtered availability", async () => {
            const room = makeRoom({ totalRooms: 4 });
            Room.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([room]),
            });
            RoomBooking.find.mockResolvedValue([{ bookedRooms: 2 }, { bookedRooms: 1 }]);

            const result = await roomService.findAll("2026-05-01", "2026-05-03");

            expect(RoomBooking.find).toHaveBeenCalledWith({
                roomNumber: "101",
                bookingStatus: {
                    $nin: ["CANCELLED", "CHECKED_OUT"],
                },
                checkInDate: { $lt: new Date("2026-05-03") },
                checkOutDate: { $gt: new Date("2026-05-01") },
            });
            expect(result[0].remainingRooms).toBe(1);
        });
    });

    describe("update", () => {
        it("updates a room and returns the new document", async () => {
            const updatedRoom = makeRoom({ roomType: "SUITE" });
            Room.findByIdAndUpdate.mockResolvedValue(updatedRoom);

            const result = await roomService.update("room-1", { roomType: "SUITE" });

            expect(result).toEqual(updatedRoom);
            expect(Room.findByIdAndUpdate).toHaveBeenCalledWith("room-1", { roomType: "SUITE" }, { new: true, runValidators: true });
        });

        it("throws 404 when the room is missing", async () => {
            Room.findByIdAndUpdate.mockResolvedValue(null);

            await expect(roomService.update("missing-id", { roomType: "SUITE" })).rejects.toMatchObject({
                message: "Room not found",
                statusCode: 404,
            });
        });
    });

    describe("delete", () => {
        it("deletes an existing room", async () => {
            Room.findByIdAndDelete.mockResolvedValue(makeRoom());

            await expect(roomService.delete("room-1")).resolves.toBeUndefined();

            expect(Room.findByIdAndDelete).toHaveBeenCalledWith("room-1");
        });

        it("throws 404 when the room cannot be deleted", async () => {
            Room.findByIdAndDelete.mockResolvedValue(null);

            await expect(roomService.delete("missing-id")).rejects.toMatchObject({
                message: "Room not found",
                statusCode: 404,
            });
        });
    });
});
