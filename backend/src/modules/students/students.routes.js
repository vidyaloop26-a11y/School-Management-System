const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, rejectRoles, ROLES } = require("../../middleware/rbac");
const studentsController = require("./students.controller");
const {
  createStudentSchema,
  updateStudentSchema,
  teacherCorrectSchema,
  listQuerySchema,
  studentIdParam,
  bulkDeleteSchema,
  bulkCreateStudentsSchema,
} = require("./students.schema");

// Every authenticated user can read students (parents see only their own child,
// enforced inside the service).
router.use(authenticate);

// School-level reads — superAdmin is walled out (use /api/support/* instead).
router.get("/", rejectRoles(ROLES.SUPER_ADMIN), validateQuery(listQuerySchema), studentsController.list);
router.get("/:id", rejectRoles(ROLES.SUPER_ADMIN), validateQuery(studentIdParam, "params"), studentsController.get);

// Create — school admin only (and super admin). Teachers cannot add users.
router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createStudentSchema),
  studentsController.create
);

// Bulk import — school admin only.
router.post(
  "/bulk",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(bulkCreateStudentsSchema),
  studentsController.bulkCreate
);

// Update — school admin full update; teaching staff correction-only.
router.put(
  "/:id",
  validateQuery(studentIdParam, "params"),
  requireDuty("teacher"),
  (req, res, next) => {
    const schema = req.user.role === ROLES.STAFF ? teacherCorrectSchema : updateStudentSchema;
    return validate(schema)(req, res, next);
  },
  studentsController.update
);

// Delete + password reset — school admin only.
router.delete(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(bulkDeleteSchema),
  studentsController.bulkDelete
);
router.delete(
  "/:id",
  validateQuery(studentIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  studentsController.remove
);
router.post(
  "/:id/reset-parent-password",
  validateQuery(studentIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  studentsController.resetParent
);

module.exports = router;