const Payroll = require("../models/Payroll");
const User = require("../../../models/User");
const asyncHandler = require("../../../utils/asyncHandler");
const AppError = require("../../../middleware/error.middleware");
const ApiResponse = require("../../../utils/apiResponse");

const calculatePayrollFields = (source) => {
  const basicSalary = Number(source.basicSalary || 0);
  const overtimeHours = Number(source.overtimeHours || 0);
  const overtimeRate = Number(source.overtimeRate || 0);
  const absentDays = Number(source.absentDays || 0);
  const dailyRate = Number(source.dailyRate || 0);
  const bonuses = Number(source.bonuses || 0);
  const overtimePay = overtimeHours * overtimeRate;
  const deductions = absentDays * dailyRate;
  const netSalary = basicSalary + overtimePay + bonuses - deductions;

  return {
    basicSalary,
    overtimeHours,
    overtimeRate,
    overtimePay,
    absentDays,
    dailyRate,
    bonuses,
    deductions,
    netSalary,
  };
};

/**
 * @desc    Get all payrolls
 * @route   GET /api/v1/payroll
 * @access  Private/Admin
 */
exports.getPayrolls = asyncHandler(async (req, res, next) => {
  const payrolls = await Payroll.find().populate("user", "username fullName role");
  ApiResponse.success(res, { payrolls }, "Payrolls retrieved successfully");
});

/**
 * @desc    Get single payroll
 * @route   GET /api/v1/payroll/:id
 * @access  Private/Admin
 */
exports.getPayroll = asyncHandler(async (req, res, next) => {
  const payroll = await Payroll.findById(req.params.id).populate("user", "username fullName role");

  if (!payroll) {
    return next(new AppError("No payroll found with that ID", 404));
  }

  ApiResponse.success(res, { payroll }, "Payroll retrieved successfully");
});

/**
 * @desc    Create new payroll (Calculates salary automatically)
 * @route   POST /api/v1/payroll
 * @access  Private/Admin
 */
exports.createPayroll = asyncHandler(async (req, res, next) => {
  const { userId, month, year, bonuses, remarks } = req.body;

  if (!userId || !month || !year) {
    return next(new AppError("Please provide userId, month and year", 400));
  }

  // 1. Fetch user to get salary profile
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // 2. Fetch data from user profile (or defaults)
  const calculatedFields = calculatePayrollFields({
    basicSalary: user.basicSalary,
    overtimeHours: user.overtimeHours,
    overtimeRate: user.overtimeRate,
    absentDays: user.absentDays,
    dailyRate: user.dailyRate,
    bonuses,
  });

  // 4. Create Payroll record
  let payroll;
  try {
    payroll = await Payroll.create({
      user: userId,
      month,
      year,
      ...calculatedFields,
      remarks,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(`A payroll already exists for ${user.fullName} in ${month} ${year}`, 409),
      );
    }

    throw error;
  }

  ApiResponse.success(res, { payroll }, "Payroll generated successfully", 201);
});

/**
 * @desc    Update payroll
 * @route   PATCH /api/v1/payroll/:id
 * @access  Private/Admin
 */
exports.updatePayroll = asyncHandler(async (req, res, next) => {
  let payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    return next(new AppError("No payroll found with that ID", 404));
  }

  const updateData = { ...req.body };

  if (updateData.userId !== undefined) {
    updateData.user = updateData.userId;
    delete updateData.userId;
  }

  if (updateData.user) {
    const user = await User.findById(updateData.user);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    updateData.basicSalary =
      updateData.basicSalary !== undefined ? updateData.basicSalary : user.basicSalary;
    updateData.overtimeHours =
      updateData.overtimeHours !== undefined
        ? updateData.overtimeHours
        : user.overtimeHours;
    updateData.overtimeRate =
      updateData.overtimeRate !== undefined ? updateData.overtimeRate : user.overtimeRate;
    updateData.absentDays =
      updateData.absentDays !== undefined ? updateData.absentDays : user.absentDays;
    updateData.dailyRate =
      updateData.dailyRate !== undefined ? updateData.dailyRate : user.dailyRate;
  }

  if (
    updateData.basicSalary !== undefined ||
    updateData.overtimeHours !== undefined ||
    updateData.overtimeRate !== undefined ||
    updateData.absentDays !== undefined ||
    updateData.dailyRate !== undefined ||
    updateData.bonuses !== undefined
  ) {
    const calculatedFields = calculatePayrollFields({
      basicSalary:
        updateData.basicSalary !== undefined
          ? updateData.basicSalary
          : payroll.basicSalary,
      overtimeHours:
        updateData.overtimeHours !== undefined
          ? updateData.overtimeHours
          : payroll.overtimeHours,
      overtimeRate:
        updateData.overtimeRate !== undefined
          ? updateData.overtimeRate
          : payroll.overtimeRate,
      absentDays:
        updateData.absentDays !== undefined
          ? updateData.absentDays
          : payroll.absentDays,
      dailyRate:
        updateData.dailyRate !== undefined ? updateData.dailyRate : payroll.dailyRate,
      bonuses: updateData.bonuses !== undefined ? updateData.bonuses : payroll.bonuses,
    });

    Object.assign(updateData, calculatedFields);
  }

  payroll = await Payroll.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  ApiResponse.success(res, { payroll }, "Payroll updated successfully");
});

/**
 * @desc    Delete payroll
 * @route   DELETE /api/v1/payroll/:id
 * @access  Private/Admin
 */
exports.deletePayroll = asyncHandler(async (req, res, next) => {
  const payroll = await Payroll.findByIdAndDelete(req.params.id);

  if (!payroll) {
    return next(new AppError("No payroll found with that ID", 404));
  }

  ApiResponse.success(res, null, "Payroll deleted successfully", 204);
});
