const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/authorization.middleware");
const { validate } = require("../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([
      "SUPER_ADMIN",
      "MANAGER",
      "STAFF_MEMBER",
      "CUSTOMER",
      "RESTAURANT_MANAGER",
      "EVENT_MANAGER",
      "HOUSEKEEPER",
      "MAINTENANCE_STAFF",
    ])
    .withMessage("Invalid role"),
];

const loginValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty"),
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty"),
  body("photoUrl").optional().isString().withMessage("Photo URL must be a string"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

const adminUserValidation = [
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username is required"),
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .notEmpty()
    .withMessage("Role is required")
    .isIn([
      "SUPER_ADMIN",
      "MANAGER",
      "STAFF_MEMBER",
      "CUSTOMER",
      "RESTAURANT_MANAGER",
      "EVENT_MANAGER",
      "HOUSEKEEPER",
      "MAINTENANCE_STAFF",
    ])
    .withMessage("Invalid role"),
  body("photoUrl").optional().isString().withMessage("Photo URL must be a string"),
  body("position").optional().isString().withMessage("Position must be a string"),
  body("basicSalary").optional().isNumeric().withMessage("Basic salary must be numeric"),
  body("attendance").optional().isNumeric().withMessage("Attendance must be numeric"),
  body("overtimeHours").optional().isNumeric().withMessage("Overtime hours must be numeric"),
  body("absentDays").optional().isNumeric().withMessage("Absent days must be numeric"),
  body("overtimeRate").optional().isNumeric().withMessage("Overtime rate must be numeric"),
  body("dailyRate").optional().isNumeric().withMessage("Daily rate must be numeric"),
  body("enabled").optional().isBoolean().withMessage("Enabled must be boolean"),
];

const adminUserCreateValidation = [
  ...adminUserValidation,
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([
      "SUPER_ADMIN",
      "MANAGER",
      "STAFF_MEMBER",
      "CUSTOMER",
      "RESTAURANT_MANAGER",
      "EVENT_MANAGER",
      "HOUSEKEEPER",
      "MAINTENANCE_STAFF",
    ])
    .withMessage("Invalid role"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Public routes
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get("/me", getMe);
router.put("/update-profile", updateProfileValidation, validate, updateProfile);
router.put(
  "/change-password",
  changePasswordValidation,
  validate,
  changePassword,
);
router.post("/logout", logout);

// Admin only routes
router.use(authorizeRoles("SUPER_ADMIN", "MANAGER")); // All routes below require admin/manager role

router.get("/users", getAllUsers);
router.post("/users", adminUserCreateValidation, validate, createUser);
router.get("/users/:id", getUser);
router.put("/users/:id", adminUserValidation, validate, updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
