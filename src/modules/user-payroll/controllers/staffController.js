const staffService = require("../services/staffService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.create(req.body);
  ApiResponse.success(res, staff, "Staff created successfully", 201);
});

exports.updateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.update(req.params.id, req.body);
  ApiResponse.success(res, staff, "Staff updated successfully");
});

exports.getStaffById = asyncHandler(async (req, res) => {
  const staff = await staffService.getById(req.params.id);
  ApiResponse.success(res, staff, "Staff retrieved successfully");
});

exports.getAllStaff = asyncHandler(async (req, res) => {
  const { name, role, page = 0, size = 10 } = req.query;
  const result = await staffService.getAll({
    name,
    role,
    page: parseInt(page),
    size: parseInt(size),
  });
  ApiResponse.success(res, result, "Staff retrieved successfully");
});

exports.softDeleteStaff = asyncHandler(async (req, res) => {
  await staffService.softDelete(req.params.id);
  ApiResponse.success(res, null, "Staff deactivated successfully");
});
