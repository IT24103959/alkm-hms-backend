const express = require("express");
const { body } = require("express-validator");
const {
  createBooking,
  updateBooking,
  getAllBookings,
  getMyBookings,
  requestCancellation,
  approveCancellation,
  checkAvailability,
  deleteBooking,
} = require("../controllers/roomBookingController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

const bookingValidation = [
  body("bookingCustomer")
    .trim()
    .notEmpty()
    .withMessage("Booking customer name is required"),
  body("customerEmail")
    .isEmail()
    .withMessage("Valid customer email is required"),
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("bookedRooms")
    .isInt({ min: 1 })
    .withMessage("Booked rooms must be at least 1"),
  body("guestCount")
    .isInt({ min: 1 })
    .withMessage("Guest count must be at least 1"),
  body("checkInDate").notEmpty().withMessage("Check-in date is required"),
  body("checkOutDate").notEmpty().withMessage("Check-out date is required"),
];

router.use(authenticateToken);

router.get(
  "/check-availability",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "CUSTOMER"),
  checkAvailability,
);

router.get("/my", authorizeRoles("CUSTOMER"), getMyBookings);

router.get("/", authorizeRoles("SUPER_ADMIN", "MANAGER"), getAllBookings);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "CUSTOMER"),
  bookingValidation,
  validate,
  createBooking,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  bookingValidation,
  validate,
  updateBooking,
);

router.patch(
  "/:id/request-cancellation",
  authorizeRoles("CUSTOMER"),
  requestCancellation,
);

router.patch(
  "/:id/approve-cancellation",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  approveCancellation,
);

router.delete("/:id", authorizeRoles("SUPER_ADMIN", "MANAGER"), deleteBooking);

module.exports = router;
