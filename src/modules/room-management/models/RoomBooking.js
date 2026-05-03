const mongoose = require("mongoose");

const RoomBookingStatus = {
    BOOKED: "BOOKED",
    CHECKED_IN: "CHECKED_IN",
    CANCELLATION_REQUESTED: "CANCELLATION_REQUESTED",
    CHECKED_OUT: "CHECKED_OUT",
    CANCELLED: "CANCELLED",
};

const roomBookingSchema = new mongoose.Schema(
    {
        bookingSequence: {
            type: Number,
        },
        bookingCustomer: {
            type: String,
            required: [true, "Booking customer name is required"],
            trim: true,
        },
        customerEmail: {
            type: String,
            required: [true, "Customer email is required"],
            trim: true,
            lowercase: true,
        },
        createdByUsername: {
            type: String,
        },
        roomNumber: {
            type: String,
            required: [true, "Room number is required"],
            trim: true,
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
        },
        bookedRooms: {
            type: Number,
            default: 1,
            min: 1,
        },
        guestCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        bookingStatus: {
            type: String,
            enum: Object.values(RoomBookingStatus),
            default: RoomBookingStatus.BOOKED,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
        },
        checkInDate: {
            type: Date,
            required: [true, "Check-in date is required"],
        },
        checkOutDate: {
            type: Date,
            required: [true, "Check-out date is required"],
        },
    },
    {
        timestamps: true,
    },
);

roomBookingSchema.index({ roomNumber: 1 });
roomBookingSchema.index({ bookingStatus: 1 });
roomBookingSchema.index({ createdByUsername: 1 });
roomBookingSchema.index({ checkInDate: 1, checkOutDate: 1 });

const RoomBooking = mongoose.model("RoomBooking", roomBookingSchema);

module.exports = { RoomBooking, RoomBookingStatus };
