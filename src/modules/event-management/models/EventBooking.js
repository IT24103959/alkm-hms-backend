const mongoose = require("mongoose");

const EventStatus = {
  INQUIRY: "INQUIRY",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const EventPackage = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

const HALL_CAPACITIES = {
  "GRAND BALLROOM": 200,
  "GARDEN PAVILION": 150,
  "CONFERENCE ROOM": 80,
  "MINI HALL": 60,
};

const eventBookingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
    },
    customerMobile: {
      type: String,
      required: [true, "Customer mobile is required"],
      trim: true,
    },
    createdByUsername: {
      type: String,
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      trim: true,
    },
    hallName: {
      type: String,
      required: [true, "Hall name is required"],
      trim: true,
    },
    packageName: {
      type: String,
      required: [true, "Package name is required"],
    },
    eventDateTime: {
      type: Date,
      required: [true, "Event date and time is required"],
    },
    endDateTime: {
      type: Date,
      required: [true, "End date and time is required"],
    },
    durationHours: {
      type: Number,
    },
    attendees: {
      type: Number,
      required: [true, "Attendees count is required"],
      min: 1,
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: 0,
    },
    pricePerGuest: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
    },
    totalCost: {
      type: Number,
    },
    notes: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.INQUIRY,
    },
  },
  {
    timestamps: true,
  },
);

eventBookingSchema.index({ createdByUsername: 1 });
eventBookingSchema.index({ status: 1 });
eventBookingSchema.index({ eventDateTime: -1 });
eventBookingSchema.index({ hallName: 1 });

const EventBooking = mongoose.model("EventBooking", eventBookingSchema);

module.exports = { EventBooking, EventStatus, EventPackage, HALL_CAPACITIES };