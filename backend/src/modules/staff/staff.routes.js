const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, rejectRoles, ROLES } = require("../../middleware/rbac");
const staffController = require("./staff.controller");
const {
  createStaffSchema,
  updateStaffSchema,
  listQuerySchema,
  staffIdParam,
  bulkCreateStaffSchema,
  resetPasswordSchema,
} = require("./staff.schema");

router.use(authenticate);

// School-level reads — superAdmin is walled out (use /api/support/* instead).
router.get("/", rejectRoles(ROLES.SUPER_ADMIN), validateQuery(listQuerySchema), staffController.list);
router.get("/:id", rejectRoles(ROLES.SUPER_ADMIN), validateQuery(staffIdParam, "params"), staffController.get);

// Create single or bulk staff
router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createStaffSchema),
  staffController.create
);

router.post(
  "/bulk",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(bulkCreateStaffSchema),
  staffController.bulkCreate
);

router.put(
  "/:id",
  validateQuery(staffIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(updateStaffSchema),
  staffController.update
);

router.delete(
  "/:id",
  validateQuery(staffIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  staffController.remove
);

router.post(
  "/:id/reset-password",
  validateQuery(staffIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(resetPasswordSchema),
  staffController.resetPassword
);

module.exports = router;