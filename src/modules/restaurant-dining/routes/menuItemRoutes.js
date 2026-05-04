const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body } = require("express-validator");
const {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  uploadImage,
  getImage,
  deleteMenuItem,
} = require("../controllers/menuItemController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

// Multer config for image uploads
const uploadDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads",
  "menu-items",
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `menu-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const menuItemValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be between 2 and 120 characters"),
  body("cuisine")
    .notEmpty()
    .isIn(["WESTERN", "THAI_CHINESE", "SRI_LANKAN", "INDIAN", "ITALIAN"])
    .withMessage("Invalid cuisine type"),
  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("mealService")
    .notEmpty()
    .isIn(["BREAKFAST", "LUNCH", "DINNER", "ALL_DAY"])
    .withMessage("Invalid meal service"),
  body("available").isBoolean().withMessage("Available must be a boolean"),
];

// Public image serving
router.get("/images/:fileName", getImage);

router.use(authenticateToken);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER", "CUSTOMER"),
  getAllMenuItems,
);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  menuItemValidation,
  validate,
  createMenuItem,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  menuItemValidation,
  validate,
  updateMenuItem,
);

router.patch(
  "/:id/availability",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  updateAvailability,
);

router.post(
  "/:id/image",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  upload.single("file"),
  uploadImage,
);

router.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  deleteMenuItem,
);

module.exports = router;
