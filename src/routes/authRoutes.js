const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
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
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
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
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
