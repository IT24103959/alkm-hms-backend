const menuItemService = require("../services/menuItemService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");
const AppError = require("../../../middleware/error.middleware");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads",
  "menu-items",
);

exports.getAllMenuItems = asyncHandler(async (req, res) => {
  const { cuisine, search } = req.query;
  const items = await menuItemService.findAll(cuisine, search);
  ApiResponse.success(res, items, "Menu items retrieved successfully");
});

exports.createMenuItem = asyncHandler(async (req, res) => {
  const item = await menuItemService.create(req.body);
  ApiResponse.success(res, item, "Menu item created successfully", 201);
});

exports.updateMenuItem = asyncHandler(async (req, res) => {
  const item = await menuItemService.update(req.params.id, req.body);
  ApiResponse.success(res, item, "Menu item updated successfully");
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const available = req.body.available;
  if (typeof available !== "boolean") {
    throw new AppError("available must be a boolean", 400);
  }
  const item = await menuItemService.updateAvailability(
    req.params.id,
    available,
  );
  ApiResponse.success(res, item, "Menu item availability updated");
});

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Image file is required", 400);
  }
  const item = await menuItemService.uploadImage(req.params.id, req.file);
  ApiResponse.success(res, item, "Image uploaded successfully");
});

exports.getImage = asyncHandler(async (req, res) => {
  const fileName = req.params.fileName;
  // Prevent path traversal
  const safeName = path.basename(fileName);
  const filePath = path.join(UPLOAD_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    throw new AppError("Image not found", 404);
  }
  res.sendFile(filePath);
});

exports.deleteMenuItem = asyncHandler(async (req, res) => {
  await menuItemService.delete(req.params.id);
  ApiResponse.success(res, null, "Menu item deleted successfully");
});
