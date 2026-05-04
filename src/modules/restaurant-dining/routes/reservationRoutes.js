const express = require("express");
const { body } = require("express-validator");
const {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateStatus,
  assignTable,
  cancelReservation,
} = require("../controllers/reservationController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

const reservationValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be between 2 and 120 characters"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("reservationDate")
    .notEmpty()
    .withMessage("Reservation date is required"),
  body("mealType")
    .notEmpty()
    .isIn(["BREAKFAST", "LUNCH", "DINNER"])
    .withMessage("Invalid meal type"),
  body("guestCount")
    .isInt({ min: 1, max: 20 })
    .withMessage("Guest count must be between 1 and 20"),
  body("seatingPreference")
    .notEmpty()
    .isIn(["INDOOR", "OUTDOOR", "OCEAN_VIEW", "PRIVATE"])
    .withMessage("Invalid seating preference"),
  body("specialRequests")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Special requests cannot exceed 1000 characters"),
];

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER", "CUSTOMER"),
  reservationValidation,
  validate,
  createReservation,
);

router.get(
  "/my",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER", "CUSTOMER"),
  getMyReservations,
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  getAllReservations,
);

router.patch(
  "/:id/status",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  body("status")
    .notEmpty()
    .isIn(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"])
    .withMessage("Invalid status"),
  validate,
  updateStatus,
);

router.patch(
  "/:id/assign-table",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"),
  body("assignedTable").trim().notEmpty().withMessage("Table is required"),
  validate,
  assignTable,
);

router.post(
  "/:id/cancel",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER", "CUSTOMER"),
  cancelReservation,
);

module.exports = router;
