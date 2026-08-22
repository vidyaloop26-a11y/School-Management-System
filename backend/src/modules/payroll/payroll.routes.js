const express = require("express");
const controller = require("./payroll.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listPayroll);
router.post("/process", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), controller.processPayroll);

module.exports = router;
