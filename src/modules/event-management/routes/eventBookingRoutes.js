const express = require("express");
const {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getAnalytics,
} = require("../controllers/eventBookingController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/analytics",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "EVENT_MANAGER"),
  getAnalytics,
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "EVENT_MANAGER", "CUSTOMER"),
  getAllBookings,
);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "EVENT_MANAGER", "CUSTOMER"),
  createBooking,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "EVENT_MANAGER"),
  updateBooking,
);

router.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "EVENT_MANAGER"),
  deleteBooking,
);

module.exports = router;