const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
    },
    overtimePay: {
      type: Number,
      required: [true, "Overtime pay is required"],
    },
    deductions: {
      type: Number,
      required: [true, "Deductions is required"],
    },
    netSalary: {
      type: Number,
      required: [true, "Net salary is required"],
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      min: 2000,
      max: 2100,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

payrollSchema.index({ staff: 1 });
payrollSchema.index({ month: 1, year: 1 });

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = { Payroll };
