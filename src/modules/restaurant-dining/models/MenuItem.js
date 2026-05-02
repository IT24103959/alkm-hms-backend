const mongoose = require("mongoose");

const CuisineType = {
  WESTERN: "WESTERN",
  THAI_CHINESE: "THAI_CHINESE",
  SRI_LANKAN: "SRI_LANKAN",
  INDIAN: "INDIAN",
  ITALIAN: "ITALIAN",
};

const MealService = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  ALL_DAY: "ALL_DAY",
};

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    cuisine: {
      type: String,
      enum: Object.values(CuisineType),
      required: [true, "Cuisine type is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0.01,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: 10,
      maxlength: 1000,
    },
    badge: {
      type: String,
      maxlength: 100,
      default: null,
    },
    mealService: {
      type: String,
      enum: Object.values(MealService),
      required: [true, "Meal service is required"],
    },
    imageFileName: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

menuItemSchema.index({ cuisine: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ mealService: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = { MenuItem, CuisineType, MealService };
