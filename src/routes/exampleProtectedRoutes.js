/**
 * Example: How to use authentication in your module routes
 *
 * This file demonstrates how to protect routes with JWT authentication
 * and implement role-based access control.
 */

const express = require("express");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");

const router = express.Router();

// Example: Public route (no authentication required)
router.get("/public-info", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "This is public information accessible to everyone",
  });
});

// Example: Protected route (authentication required, any logged-in user)
router.get("/dashboard", authenticateToken, (req, res) => {
  res.status(200).json({
    status: "success",
    message: `Welcome to your dashboard, ${req.user.fullName}!`,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

// Example: Admin only route
router.get(
  "/admin-panel",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Admin panel - only super admins can access this",
    });
  },
);

// Example: Multiple roles allowed
router.get(
  "/staff-area",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "MANAGER", "STAFF_MEMBER"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Staff area - admins, managers, and staff can access this",
    });
  },
);

// Example: Department-specific access
router.get(
  "/housekeeping-dashboard",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Housekeeping dashboard",
      user: req.user,
    });
  },
);

// Example: Create operation with authentication
router.post("/create-item", authenticateToken, (req, res) => {
  // The authenticated user is available in req.user
  const createdBy = req.user._id;
  const createdByName = req.user.fullName;

  res.status(201).json({
    status: "success",
    message: "Item created successfully",
    data: {
      createdBy,
      createdByName,
      // ... other item data
    },
  });
});

// Example: Update operation (only admin or the owner can update)
router.put("/items/:id", authenticateToken, async (req, res) => {
  // Example logic to check ownership
  const itemOwnerId = "some-user-id"; // Fetch from database
  const currentUserId = req.user._id.toString();
  const isAdmin = req.user.role === "SUPER_ADMIN";

  if (currentUserId !== itemOwnerId && !isAdmin) {
    return res.status(403).json({
      status: "error",
      message: "You can only update your own items",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Item updated successfully",
  });
});

module.exports = router;
