const express = require("express");
const { getSummary } = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/authorization.middleware");

const router = express.Router();

router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getSummary,
);

module.exports = router;
