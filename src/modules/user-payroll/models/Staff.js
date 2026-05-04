const mongoose = require("mongoose");

const StaffStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: 0.01,
    },
    attendance: {
      type: Number,
      required: [true, "Attendance is required"],
      min: 0,
      max: 31,
    },
    overtimeHours: {
      type: Number,
      required: [true, "Overtime hours is required"],
      min: 0,
    },
    absentDays: {
      type: Number,
      required: [true, "Absent days is required"],
      min: 0,
    },
    overtimeRate: {
      type: Number,
      required: [true, "Overtime rate is required"],
      min: 0.01,
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: 0.01,
    },
    status: {
      type: String,
      enum: Object.values(StaffStatus),
      default: StaffStatus.ACTIVE,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

staffSchema.index({ name: 1 });
staffSchema.index({ status: 1 });

const Staff = mongoose.model("Staff", staffSchema);

module.exports = { Staff, StaffStatus };
