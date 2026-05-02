const express = require("express");
const { body } = require("express-validator");
const {
  createStaff,
  updateStaff,
  getStaffById,
  getAllStaff,
  softDeleteStaff,
} = require("../controllers/staffController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

const staffValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("role")
    .optional()
    .isIn([
      "STAFF_MEMBER",
      "HOUSEKEEPER",
      "MAINTENANCE_STAFF",
      "RESTAURANT_MANAGER",
      "EVENT_MANAGER",
      "MANAGER",
    ])
    .withMessage("Invalid role"),
  body("basicSalary")
    .isFloat({ min: 0.01 })
    .withMessage("Basic salary must be greater than 0"),
  body("attendance")
    .isInt({ min: 0, max: 31 })
    .withMessage("Attendance must be between 0 and 31"),
  body("overtimeHours")
    .isFloat({ min: 0 })
    .withMessage("Overtime hours cannot be negative"),
  body("absentDays")
    .isInt({ min: 0 })
    .withMessage("Absent days cannot be negative"),
  body("overtimeRate")
    .isFloat({ min: 0.01 })
    .withMessage("Overtime rate must be greater than 0"),
  body("dailyRate")
    .isFloat({ min: 0.01 })
    .withMessage("Daily rate must be greater than 0"),
];

const createStaffValidation = [
  ...staffValidation,
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

router.use(authenticateToken);

router.get("/", authorizeRoles("SUPER_ADMIN", "MANAGER"), getAllStaff);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "STAFF_MEMBER"),
  getStaffById,
);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createStaffValidation,
  validate,
  createStaff,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  staffValidation,
  validate,
  updateStaff,
);

router.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  softDeleteStaff,
);

module.exports = router;
