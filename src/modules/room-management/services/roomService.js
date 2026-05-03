const { Room, RoomStatus } = require("../models/Room");
const { RoomBooking, RoomBookingStatus } = require("../models/RoomBooking");
const AppError = require("../../../middleware/error.middleware");

class RoomService {
    /**
     * Create a new room
     */
    async create(roomData) {
        const existing = await Room.findOne({ roomNumber: roomData.roomNumber });
        if (existing) {
            throw new AppError(`Room number ${roomData.roomNumber} already exists`, 400);
        }
        return await Room.create(roomData);
    }

    /**
     * Update an existing room
     */
    async update(id, roomData) {
        const room = await Room.findByIdAndUpdate(id, roomData, {
            new: true,
            runValidators: true,
        });
        if (!room) {
            throw new AppError("Room not found", 404);
        }
        return room;
    }

    /**
     * Get all rooms, optionally filtered by availability for given dates
     */
    async findAll(checkInDate, checkOutDate) {
        const rooms = await Room.find().sort({ roomNumber: 1 });

        if (!checkInDate || !checkOutDate) {
            return rooms.map((r) => this._toResponse(r, r.totalRooms));
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        return await Promise.all(
            rooms.map(async (room) => {
                const bookedCount = await this._getBookedCount(room.roomNumber, checkIn, checkOut);
                const remaining = room.totalRooms - bookedCount;
                return this._toResponse(room, remaining);
            }),
        );
    }

    /**
     * Delete a room
     */
    async delete(id) {
        const room = await Room.findByIdAndDelete(id);
        if (!room) {
            throw new AppError("Room not found", 404);
        }
    }

    async _getBookedCount(roomNumber, checkIn, checkOut) {
        const bookings = await RoomBooking.find({
            roomNumber,
            bookingStatus: {
                $nin: [RoomBookingStatus.CANCELLED, RoomBookingStatus.CHECKED_OUT],
            },
            checkInDate: { $lt: checkOut },
            checkOutDate: { $gt: checkIn },
        });
        return bookings.reduce((sum, b) => sum + (b.bookedRooms || 1), 0);
    }

    _toResponse(room, remainingRooms) {
        return {
            _id: room._id,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            photoUrl: room.photoUrl,
            roomDescription: room.roomDescription,
            capacity: room.capacity,
            totalRooms: room.totalRooms,
            remainingRooms,
            normalPrice: room.normalPrice,
            weekendPrice: room.weekendPrice,
            seasonalPrice: room.seasonalPrice,
            roomStatus: room.roomStatus,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
        };
    }
}

module.exports = new RoomService();
