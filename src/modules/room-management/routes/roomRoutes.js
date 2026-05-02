const express = require("express");
const { body } = require("express-validator");
const {
  createRoom,
  updateRoom,
  getAllRooms,
  deleteRoom,
} = require("../controllers/roomController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

const roomValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("roomType")
    .notEmpty()
    .isIn(["STANDARD", "DELUXE", "SUITE", "FAMILY"])
    .withMessage("Invalid room type"),
  body("photoUrl").trim().notEmpty().withMessage("Photo URL is required"),
  body("roomDescription")
    .trim()
    .notEmpty()
    .withMessage("Room description is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("totalRooms")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("normalPrice")
    .isFloat({ min: 0.01 })
    .withMessage("Normal price must be greater than 0"),
  body("weekendPrice")
    .isFloat({ min: 0.01 })
    .withMessage("Weekend price must be greater than 0"),
  body("seasonalPrice")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Seasonal price must be greater than 0"),
  body("roomStatus")
    .notEmpty()
    .isIn(["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE"])
    .withMessage("Invalid room status"),
];

router.use(authenticateToken);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "CUSTOMER"),
  getAllRooms,
);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  roomValidation,
  validate,
  createRoom,
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  roomValidation,
  validate,
  updateRoom,
);

router.delete("/:id", authorizeRoles("SUPER_ADMIN", "MANAGER"), deleteRoom);

module.exports = router;
