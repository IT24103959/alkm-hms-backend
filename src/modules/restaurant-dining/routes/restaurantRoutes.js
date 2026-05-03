const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const reservationController = require("../controllers/reservationController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const { authorizeRoles } = require("../../../middleware/authorization.middleware");

router.use(authenticateToken);

// ── Menu Items ───────────────────────────────────────────────────────────────
// Read: all authenticated users (customers can browse menu)
router.get("/menu", menuController.getMenuItems);
router.get("/menu/:id", menuController.getMenuItem);

// Write: managers only
router.post("/menu", authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"), menuController.createMenuItem);
router.patch("/menu/:id", authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"), menuController.updateMenuItem);
router.delete("/menu/:id", authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"), menuController.deleteMenuItem);

// ── Table Reservations ──────────────────────────────────────────────────────
// Read: managers see all; customers see all (simplified)
router.get("/reservations", reservationController.getReservations);
router.get("/reservations/:id", reservationController.getReservation);

// Write: any authenticated user can reserve, managers manage status
router.post("/reservations", reservationController.createReservation);
router.patch("/reservations/:id", authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"), reservationController.updateReservation);
router.delete("/reservations/:id", authorizeRoles("SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"), reservationController.deleteReservation);

module.exports = router;
