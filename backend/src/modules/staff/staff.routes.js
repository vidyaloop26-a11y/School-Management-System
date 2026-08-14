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

// Bulk import staff / teachers — school admin only
router.post(
  "/bulk",
  requireRole(ROLES.SCHOOL_ADMIN),
  staffController.bulkCreate
);

// Create single staff — school admin only
router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createStaffSchema),
  staffController.create
);

router.get("/:id", validateQuery(staffIdParam, "params"), staffController.get);

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