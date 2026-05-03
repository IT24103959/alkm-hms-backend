const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const { authorizeRoles } = require("../../../middleware/authorization.middleware");

// All routes are protected and for admins/managers
router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN", "MANAGER"));

router
  .route("/")
  .get(payrollController.getPayrolls)
  .post(payrollController.createPayroll);

router
  .route("/:id")
  .get(payrollController.getPayroll)
  .patch(payrollController.updatePayroll)
  .delete(payrollController.deletePayroll);

module.exports = router;
