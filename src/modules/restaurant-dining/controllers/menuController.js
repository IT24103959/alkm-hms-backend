const MenuItem = require("../models/MenuItem");
const asyncHandler = require("../../../utils/asyncHandler");
const AppError = require("../../../middleware/error.middleware");
const ApiResponse = require("../../../utils/apiResponse");

// GET /api/v1/restaurant/menu
exports.getMenuItems = asyncHandler(async (req, res) => {
  const { category, available } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (available !== undefined) filter.available = available === "true";

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  ApiResponse.success(res, { items }, "Menu items retrieved successfully");
});

// GET /api/v1/restaurant/menu/:id
exports.getMenuItem = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return next(new AppError("Menu item not found", 404));
  ApiResponse.success(res, { item }, "Menu item retrieved successfully");
});

// POST /api/v1/restaurant/menu
exports.createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, imageUrl, available, preparationTime, tags } = req.body;
  const item = await MenuItem.create({ name, description, category, price, imageUrl, available, preparationTime, tags });
  ApiResponse.success(res, { item }, "Menu item created successfully", 201);
});

// PATCH /api/v1/restaurant/menu/:id
exports.updateMenuItem = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return next(new AppError("Menu item not found", 404));
  ApiResponse.success(res, { item }, "Menu item updated successfully");
});

// DELETE /api/v1/restaurant/menu/:id
exports.deleteMenuItem = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return next(new AppError("Menu item not found", 404));
  ApiResponse.success(res, null, "Menu item deleted successfully");
});
