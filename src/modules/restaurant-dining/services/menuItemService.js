const { MenuItem } = require("../models/MenuItem");
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

class MenuItemService {
  async create(itemData) {
    return await MenuItem.create(itemData);
  }

  async update(id, itemData) {
    const item = await MenuItem.findByIdAndUpdate(id, itemData, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      throw new AppError("Menu item not found", 404);
    }
    return item;
  }

  async updateAvailability(id, available) {
    const item = await MenuItem.findByIdAndUpdate(
      id,
      { available },
      { new: true },
    );
    if (!item) {
      throw new AppError("Menu item not found", 404);
    }
    return item;
  }

  async uploadImage(id, file) {
    const item = await MenuItem.findById(id);
    if (!item) {
      throw new AppError("Menu item not found", 404);
    }

    // Remove old image if exists
    if (item.imageFileName) {
      const oldPath = path.join(UPLOAD_DIR, item.imageFileName);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    item.imageFileName = file.filename;
    await item.save();
    return item;
  }

  async findAll(cuisine, search) {
    const query = {};
    if (cuisine) {
      query.cuisine = cuisine;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    return await MenuItem.find(query).sort({ createdAt: -1 });
  }

  async delete(id) {
    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) {
      throw new AppError("Menu item not found", 404);
    }
    // Remove image file if exists
    if (item.imageFileName) {
      const imgPath = path.join(UPLOAD_DIR, item.imageFileName);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }
  }
}

module.exports = new MenuItemService();
