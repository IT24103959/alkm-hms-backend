const mongoose = require("mongoose");

const RoomType = {
  STANDARD: "STANDARD",
  DELUXE: "DELUXE",
  SUITE: "SUITE",
  FAMILY: "FAMILY",
};

const RoomStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  OCCUPIED: "OCCUPIED",
  CLEANING: "CLEANING",
  MAINTENANCE: "MAINTENANCE",
};

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: Object.values(RoomType),
      required: [true, "Room type is required"],
    },
    photoUrl: {
      type: String,
      required: [true, "Photo URL is required"],
    },
    roomDescription: {
      type: String,
      required: [true, "Room description is required"],
      maxlength: 1000,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },
    totalRooms: {
      type: Number,
      required: [true, "Total rooms is required"],
      min: 1,
      default: 1,
    },
    normalPrice: {
      type: Number,
      required: [true, "Normal price is required"],
      min: 0.01,
    },
    weekendPrice: {
      type: Number,
      required: [true, "Weekend price is required"],
      min: 0.01,
    },
    seasonalPrice: {
      type: Number,
      default: null,
    },
    roomStatus: {
      type: String,
      enum: Object.values(RoomStatus),
      required: [true, "Room status is required"],
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({ roomNumber: 1 });
roomSchema.index({ roomStatus: 1 });
roomSchema.index({ roomType: 1 });

const Room = mongoose.model("Room", roomSchema);

module.exports = { Room, RoomType, RoomStatus };
