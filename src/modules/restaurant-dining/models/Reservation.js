const mongoose = require("mongoose");

const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
};

const SeatingPreference = {
  INDOOR: "INDOOR",
  OUTDOOR: "OUTDOOR",
  OCEAN_VIEW: "OCEAN_VIEW",
  PRIVATE: "PRIVATE",
};

const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SEATED: "SEATED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const reservationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    createdByUsername: {
      type: String,
    },
    reservationDate: {
      type: Date,
      required: [true, "Reservation date is required"],
    },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: [true, "Meal type is required"],
    },
    guestCount: {
      type: Number,
      required: [true, "Guest count is required"],
      min: 1,
      max: 20,
    },
    seatingPreference: {
      type: String,
      enum: Object.values(SeatingPreference),
      required: [true, "Seating preference is required"],
    },
    specialRequests: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    assignedTable: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

reservationSchema.index({ createdByUsername: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ reservationDate: 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = {
  Reservation,
  MealType,
  SeatingPreference,
  ReservationStatus,
};
