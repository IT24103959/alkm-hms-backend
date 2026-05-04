const User = require("../../../models/User");
const { Payroll } = require("../models/Payroll");
const AppError = require("../../../middleware/error.middleware");

class PayrollService {
  /**
   * Calculate and save payroll for a staff member (User)
   * netSalary = basicSalary + overtimePay - deductions
   * overtimePay = overtimeHours * overtimeRate
   * deductions = absentDays * dailyRate
   */
  async calculateAndSave({ staffId, month, year }) {
    const user = await User.findById(staffId);
    if (!user) {
      throw new AppError("Staff member not found", 404);
    }

    const overtimePay =
      Math.round((user.overtimeHours || 0) * (user.overtimeRate || 0) * 100) /
      100;
    const deductions =
      Math.round((user.absentDays || 0) * (user.dailyRate || 0) * 100) / 100;
    const netSalary =
      Math.round(((user.basicSalary || 0) + overtimePay - deductions) * 100) /
      100;

    const payroll = await Payroll.create({
      staff: staffId,
      basicSalary: user.basicSalary || 0,
      overtimePay,
      deductions,
      netSalary,
      month,
      year,
    });

    return await payroll.populate(
      "staff",
      "username fullName position basicSalary",
    );
  }

  async getAll() {
    return await Payroll.find()
      .populate("staff", "username fullName position basicSalary")
      .sort({ year: -1, month: -1, generatedAt: -1 });
  }

  async getByStaff(staffId) {
    return await Payroll.find({ staff: staffId })
      .populate("staff", "username fullName position basicSalary")
      .sort({ year: -1, month: -1 });
  }

  async getMyPayroll(username) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return await Payroll.find({ staff: user._id })
      .populate("staff", "username fullName position basicSalary")
      .sort({ year: -1, month: -1 });
  }

  async exportCsv(month, year) {
    const query = {};
    if (month) query.month = month;
    if (year) query.year = year;

    const records = await Payroll.find(query)
      .populate("staff", "fullName position")
      .sort({ year: -1, month: -1 });

    const header =
      "ID,Staff Name,Position,Basic Salary,Overtime Pay,Deductions,Net Salary,Month,Year,Generated At\n";
    const rows = records
      .map((p) => {
        return [
          p._id,
          p.staff?.fullName || "",
          p.staff?.position || "",
          p.basicSalary,
          p.overtimePay,
          p.deductions,
          p.netSalary,
          p.month,
          p.year,
          p.generatedAt?.toISOString() || "",
        ].join(",");
      })
      .join("\n");

    return header + rows;
  }
}

module.exports = new PayrollService();
