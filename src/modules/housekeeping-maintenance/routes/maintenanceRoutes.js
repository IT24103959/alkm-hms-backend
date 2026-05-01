const express = require("express");
const { body } = require("express-validator");
const {
  checkRoom,
  createTicket,
  getAllTickets,
  getStats,
  getTicket,
  updateTicket,
  updateTicketStatus,
  addResolutionDetails,
  deleteTicket,
} = require("../controllers/maintenanceController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const createTicketValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("facilityType")
    .notEmpty()
    .isIn(["AC", "PLUMBING", "ELECTRICAL", "FURNITURE", "OTHER"])
    .withMessage("Invalid facility type"),
  body("issueDescription")
    .trim()
    .notEmpty()
    .withMessage("Issue description is required"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Invalid priority"),
];

const statusUpdateValidation = [
  body("status")
    .notEmpty()
    .isIn(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .withMessage("Invalid status"),
];

const resolutionValidation = [
  body("resolutionNotes")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Resolution notes cannot be empty if provided"),
  body("partsUsed")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Parts used cannot be empty if provided"),
];

// Public route - no authentication required
router.get("/check-room/:roomNumber", checkRoom);

// Apply authentication to all remaining routes
router.use(authenticateToken);

// Admin/Manager only routes
router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createTicketValidation,
  validate,
  createTicket,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createTicketValidation,
  validate,
  updateTicket,
);

router.delete("/:id", authorizeRoles("SUPER_ADMIN", "MANAGER"), deleteTicket);

// Stats - accessible by multiple roles
router.get(
  "/stats",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER", "MAINTENANCE_STAFF"),
  getStats,
);

// Maintenance staff routes
router.patch(
  "/:id/status",
  authorizeRoles("MAINTENANCE_STAFF"),
  statusUpdateValidation,
  validate,
  updateTicketStatus,
);

router.patch(
  "/:id/resolution",
  authorizeRoles("MAINTENANCE_STAFF"),
  resolutionValidation,
  validate,
  addResolutionDetails,
);

// View routes - accessible by admin, manager, and maintenance staff
router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "MAINTENANCE_STAFF"),
  getAllTickets,
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "MAINTENANCE_STAFF"),
  getTicket,
);

module.exports = router;
