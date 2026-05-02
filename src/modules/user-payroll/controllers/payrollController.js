const payrollService = require("../services/payrollService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.calculatePayroll = asyncHandler(async (req, res) => {
  const payroll = await payrollService.calculateAndSave(req.body);
  ApiResponse.success(res, payroll, "Payroll calculated successfully", 201);
});

exports.getAllPayroll = asyncHandler(async (req, res) => {
  const payrolls = await payrollService.getAll();
  ApiResponse.success(res, payrolls, "Payroll records retrieved successfully");
});

exports.getPayrollByStaff = asyncHandler(async (req, res) => {
  const payrolls = await payrollService.getByStaff(req.params.staffId);
  ApiResponse.success(res, payrolls, "Payroll records retrieved successfully");
});

exports.getMyPayroll = asyncHandler(async (req, res) => {
  const payrolls = await payrollService.getMyPayroll(req.user.username);
  ApiResponse.success(res, payrolls, "Your payroll retrieved successfully");
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const csv = await payrollService.exportCsv(
    month ? parseInt(month) : undefined,
    year ? parseInt(year) : undefined,
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=payroll-report.csv",
  );
  res.setHeader("Content-Type", "text/plain");
  res.send(csv);
});
