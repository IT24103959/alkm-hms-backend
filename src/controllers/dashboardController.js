const dashboardService = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary();
  ApiResponse.success(res, summary, "Dashboard summary retrieved successfully");
});
