const express = require("express");
const controller = require("./payroll.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { validate, validateQuery } = require("../../middleware/validate");
const { listPayrollQuerySchema, processPayrollSchema } = require("./payroll.schema");

const router = express.Router();

router.use(authenticate);

router.get("/", validateQuery(listPayrollQuerySchema), controller.listPayroll);
router.post(
  "/process",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  validate(processPayrollSchema),
  controller.processPayroll
);

module.exports = router;
