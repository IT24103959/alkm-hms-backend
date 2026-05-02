const express = require("express");
const { body } = require("express-validator");
const {
  calculatePayroll,
  getAllPayroll,
  getPayrollByStaff,
  getMyPayroll,
  exportCsv,
} = require("../controllers/payrollController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../../../middleware/authorization.middleware");
const { validate } = require("../../../middleware/validation.middleware");

const router = express.Router();

const payrollRequestValidation = [
  body("staffId").notEmpty().withMessage("Staff ID is required"),
  body("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),
  body("year")
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be between 2000 and 2100"),
];

router.use(authenticateToken);

router.get("/export/csv", authorizeRoles("SUPER_ADMIN", "MANAGER"), exportCsv);

router.get("/my", authorizeRoles("STAFF_MEMBER"), getMyPayroll);

router.get(
  "/staff/:staffId",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getPayrollByStaff,
);

router.get("/", authorizeRoles("SUPER_ADMIN", "MANAGER"), getAllPayroll);

router.post(
  "/calculate",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  payrollRequestValidation,
  validate,
  calculatePayroll,
);

module.exports = router;
