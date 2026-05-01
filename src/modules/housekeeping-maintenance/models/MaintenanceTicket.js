const mongoose = require("mongoose");
const { Priority } = require("./HousekeepingTask");

// Enums
const FacilityType = {
  AC: "AC",
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  FURNITURE: "FURNITURE",
  OTHER: "OTHER",
};

const MaintenanceStatus = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};

const maintenanceTicketSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      maxlength: 20,
    },
    facilityType: {
      type: String,
      enum: Object.values(FacilityType),
      required: [true, "Facility type is required"],
    },
    issueDescription: {
      type: String,
      required: [true, "Issue description is required"],
    },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.OPEN,
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
    resolutionNotes: {
      type: String,
      default: null,
    },
    partsUsed: {
      type: String,
      default: null,
    },
    resolvedAt: {
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
maintenanceTicketSchema.index({ roomNumber: 1 });
maintenanceTicketSchema.index({ status: 1 });
maintenanceTicketSchema.index({ staff: 1 });
maintenanceTicketSchema.index({ deadline: 1 });

const MaintenanceTicket = mongoose.model(
  "MaintenanceTicket",
  maintenanceTicketSchema,
);

module.exports = {
  MaintenanceTicket,
  FacilityType,
  MaintenanceStatus,
  Priority,
};
