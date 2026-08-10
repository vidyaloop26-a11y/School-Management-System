const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const staffController = require("./staff.controller");
const {
  createStaffSchema,
  updateStaffSchema,
  listQuerySchema,
  staffIdParam,
} = require("./staff.schema");

router.use(authenticate);

router.get("/", validateQuery(listQuerySchema), staffController.list);
router.get("/:id", validateQuery(staffIdParam, "params"), staffController.get);

// Create / delete / reset password — school admin only (teachers cannot add users).
router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createStaffSchema),
  staffController.create
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
  staffController.resetPassword
);

module.exports = router;