const express = require("express");
const controller = require("./leave.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { validate, validateQuery } = require("../../middleware/validate");
const {
  applyLeaveSchema,
  updateLeaveStatusSchema,
  leaveIdParam,
  listLeavesQuerySchema,
} = require("./leave.schema");

const router = express.Router();

router.use(authenticate);

// Applying for leave: any authenticated member of a school (staff or parent).
router.get("/", validateQuery(listLeavesQuerySchema), controller.listLeaves);
router.post("/", validate(applyLeaveSchema), controller.applyLeave);
router.post("/apply", validate(applyLeaveSchema), controller.applyLeave);

// Approving/rejecting leave: administrative action only.
router.put(
  "/:id/status",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  validateQuery(leaveIdParam, "params"),
  validate(updateLeaveStatusSchema),
  controller.updateStatus
);
router.patch(
  "/:id/status",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  validateQuery(leaveIdParam, "params"),
  validate(updateLeaveStatusSchema),
  controller.updateStatus
);

module.exports = router;
