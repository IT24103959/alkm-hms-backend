const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required"], // e.g., "January"
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    dailyRate: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: [true, "Net salary is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
    paymentDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one payslip per user per month/year
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);
