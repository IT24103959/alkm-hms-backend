const mongoose = require("mongoose");

// Enums
const RoomCondition = {
  OCCUPIED: "OCCUPIED",
  CHECKOUT: "CHECKOUT",
  PRE_CHECK_IN: "PRE_CHECK_IN",
};

const HousekeepingTaskType = {
  CLEANING: "CLEANING",
  INSPECTION: "INSPECTION",
  TURNDOWN: "TURNDOWN",
};

const HousekeepingStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  CLEANED: "CLEANED",
  INSPECTED: "INSPECTED",
};

const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

const housekeepingTaskSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      maxlength: 20,
    },
    roomCondition: {
      type: String,
      enum: Object.values(RoomCondition),
      required: [true, "Room condition is required"],
    },
    taskType: {
      type: String,
      enum: Object.values(HousekeepingTaskType),
      required: [true, "Task type is required"],
    },
    status: {
      type: String,
      enum: Object.values(HousekeepingStatus),
      default: HousekeepingStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    cleaningNotes: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    alertSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
housekeepingTaskSchema.index({ roomNumber: 1 });
housekeepingTaskSchema.index({ status: 1 });
housekeepingTaskSchema.index({ staff: 1 });
housekeepingTaskSchema.index({ deadline: 1 });

const HousekeepingTask = mongoose.model(
  "HousekeepingTask",
  housekeepingTaskSchema,
);

module.exports = {
  HousekeepingTask,
  RoomCondition,
  HousekeepingTaskType,
  HousekeepingStatus,
  Priority,
};
