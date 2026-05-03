const mongoose = require("mongoose");

const tableReservationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    tableNumber: {
      type: String,
      required: [true, "Table number is required"],
      trim: true,
    },
    guestCount: {
      type: Number,
      required: [true, "Guest count is required"],
      min: [1, "At least 1 guest is required"],
    },
    reservationDate: {
      type: Date,
      required: [true, "Reservation date is required"],
    },
    reservationTime: {
      type: String, // e.g. "19:30"
      required: [true, "Reservation time is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    specialRequests: {
      type: String,
      trim: true,
      default: "",
    },
    orderedItems: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        quantity: { type: Number, default: 1 },
        itemName: { type: String }, // snapshot
        itemPrice: { type: Number }, // snapshot
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TableReservation", tableReservationSchema);
