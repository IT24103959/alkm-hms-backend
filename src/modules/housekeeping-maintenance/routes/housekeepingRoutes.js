const express = require("express");
const { body } = require("express-validator");
const {
  createTask,
  createFromBooking,
  getAllTasks,
  getStats,
  getTask,
  updateTask,
  updateTaskStatus,
  addCleaningNotes,
  deleteTask,
} = require("../controllers/housekeepingController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("roomCondition")
    .notEmpty()
    .isIn(["OCCUPIED", "CHECKOUT", "PRE_CHECK_IN"])
    .withMessage("Invalid room condition"),
  body("taskType")
    .notEmpty()
    .isIn(["CLEANING", "INSPECTION", "TURNDOWN"])
    .withMessage("Invalid task type"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),
];

const bookingTriggerValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("checkInDate").notEmpty().withMessage("Check-in date is required"),
  body("checkOutDate").notEmpty().withMessage("Check-out date is required"),
];

const statusUpdateValidation = [
  body("status")
    .notEmpty()
    .isIn(["PENDING", "IN_PROGRESS", "CLEANED", "INSPECTED"])
    .withMessage("Invalid status"),
];

const notesValidation = [
  body("notes").trim().notEmpty().withMessage("Notes are required"),
];

// Apply authentication to all routes
router.use(authenticateToken);

// Public for all authenticated users (booking trigger)
router.post(
  "/booking-trigger",
  bookingTriggerValidation,
  validate,
  createFromBooking,
);

// Admin/Manager only routes
router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createTaskValidation,
  validate,
  createTask,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createTaskValidation,
  validate,
  updateTask,
);

router.delete("/:id", authorizeRoles("SUPER_ADMIN", "MANAGER"), deleteTask);

// Stats - accessible by multiple roles
router.get(
  "/stats",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER", "MAINTENANCE_STAFF"),
  getStats,
);

// Housekeeper routes
router.patch(
  "/:id/status",
  authorizeRoles("HOUSEKEEPER"),
  statusUpdateValidation,
  validate,
  updateTaskStatus,
);

router.patch(
  "/:id/notes",
  authorizeRoles("HOUSEKEEPER"),
  notesValidation,
  validate,
  addCleaningNotes,
);

// View routes - accessible by admin, manager, and housekeeper
router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER"),
  getAllTasks,
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER"),
  getTask,
);

module.exports = router;
