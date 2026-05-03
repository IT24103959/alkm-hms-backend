const { Room } = require("../models/Room");
const { RoomBooking, RoomBookingStatus } = require("../models/RoomBooking");
const AppError = require("../../../middleware/error.middleware");

class RoomBookingService {
    /**
     * Create a new room booking with automatic amount calculation
     */
    async create(bookingData, user) {
        const { roomNumber, checkInDate, checkOutDate, bookedRooms = 1 } = bookingData;

        const room = await Room.findOne({ roomNumber });
        if (!room) {
            throw new AppError(`Room ${roomNumber} not found`, 404);
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (checkOut <= checkIn) {
            throw new AppError("Check-out date must be after check-in date", 400);
        }

        const availability = await this._checkAvailability(room, checkIn, checkOut, bookedRooms);
        if (!availability.available) {
            throw new AppError(availability.message, 400);
        }

        const amount = this._calculateAmount(room, checkIn, checkOut, bookedRooms);

        const lastBooking = await RoomBooking.findOne().sort({
            bookingSequence: -1,
        });
        const bookingSequence = lastBooking ? (lastBooking.bookingSequence || 0) + 1 : 1;

        const booking = await RoomBooking.create({
            ...bookingData,
            room: room._id,
            amount,
            bookingSequence,
            createdByUsername: user.username,
            checkInDate: checkIn,
            checkOutDate: checkOut,
        });

        return await booking.populate("room", "roomNumber roomType capacity");
    }

    /**
     * Update a booking (Admin/Manager only)
     */
    async update(id, bookingData) {
        const booking = await RoomBooking.findByIdAndUpdate(id, bookingData, {
            new: true,
            runValidators: true,
        }).populate("room", "roomNumber roomType capacity");

        if (!booking) {
            throw new AppError("Room booking not found", 404);
        }
        return booking;
    }

    /**
     * Get all bookings
     */
    async findAll() {
        return await RoomBooking.find().populate("room", "roomNumber roomType capacity").sort({ createdAt: -1 });
    }

    /**
     * Get bookings for the current user
     */
    async findMine(username) {
        return await RoomBooking.find({ createdByUsername: username }).populate("room", "roomNumber roomType capacity").sort({ createdAt: -1 });
    }

    /**
     * Customer requests cancellation
     */
    async requestCancellation(id, user) {
        const booking = await RoomBooking.findById(id);
        if (!booking) {
            throw new AppError("Room booking not found", 404);
        }

        if (booking.createdByUsername !== user.username) {
            throw new AppError("You can only cancel your own bookings", 403);
        }

        if (booking.bookingStatus !== RoomBookingStatus.BOOKED) {
            throw new AppError("Only BOOKED reservations can request cancellation", 400);
        }

        booking.bookingStatus = RoomBookingStatus.CANCELLATION_REQUESTED;
        await booking.save();
        return await booking.populate("room", "roomNumber roomType capacity");
    }

    /**
     * Admin/Manager approves a cancellation request
     */
    async approveCancellation(id) {
        const booking = await RoomBooking.findById(id);
        if (!booking) {
            throw new AppError("Room booking not found", 404);
        }

        if (booking.bookingStatus !== RoomBookingStatus.CANCELLATION_REQUESTED) {
            throw new AppError("Booking does not have a pending cancellation request", 400);
        }

        booking.bookingStatus = RoomBookingStatus.CANCELLED;
        await booking.save();
        return await booking.populate("room", "roomNumber roomType capacity");
    }

    /**
     * Check room availability for given dates
     */
    async checkAvailability(roomNumber, checkInDate, checkOutDate) {
        const room = await Room.findOne({ roomNumber });
        if (!room) {
            throw new AppError(`Room ${roomNumber} not found`, 404);
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const result = await this._checkAvailability(room, checkIn, checkOut, 1);

        return {
            roomNumber,
            checkInDate,
            checkOutDate,
            available: result.available,
            remainingRooms: result.remainingRooms,
            totalRooms: room.totalRooms,
            message: result.message,
        };
    }

    /**
     * Delete a booking
     */
    async delete(id) {
        const booking = await RoomBooking.findByIdAndDelete(id);
        if (!booking) {
            throw new AppError("Room booking not found", 404);
        }
    }

    async _checkAvailability(room, checkIn, checkOut, requestedRooms) {
        const bookings = await RoomBooking.find({
            roomNumber: room.roomNumber,
            bookingStatus: {
                $nin: [RoomBookingStatus.CANCELLED, RoomBookingStatus.CHECKED_OUT],
            },
            checkInDate: { $lt: checkOut },
            checkOutDate: { $gt: checkIn },
        });

        const bookedCount = bookings.reduce((sum, b) => sum + (b.bookedRooms || 1), 0);
        const remaining = room.totalRooms - bookedCount;

        if (remaining < requestedRooms) {
            return {
                available: false,
                remainingRooms: remaining,
                message: `Only ${remaining} room(s) available for the selected dates`,
            };
        }

        return {
            available: true,
            remainingRooms: remaining,
            message: "Room is available",
        };
    }

    _calculateAmount(room, checkIn, checkOut, bookedRooms) {
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        let totalAmount = 0;

        for (let i = 0; i < nights; i++) {
            const date = new Date(checkIn);
            date.setDate(date.getDate() + i);
            const day = date.getDay();
            // Weekend: Saturday (6) or Sunday (0)
            const isWeekend = day === 0 || day === 6;
            totalAmount += isWeekend ? room.weekendPrice : room.normalPrice;
        }

        return totalAmount * bookedRooms;
    }
}

module.exports = new RoomBookingService();
