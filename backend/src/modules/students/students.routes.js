const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const studentsController = require("./students.controller");
const {
  createStudentSchema,
  updateStudentSchema,
  teacherCorrectSchema,
  listQuerySchema,
  studentIdParam,
} = require("./students.schema");

// Every authenticated user can read students (parents see only their own child,
// enforced inside the service).
router.use(authenticate);

router.get("/", validateQuery(listQuerySchema), studentsController.list);

// Bulk import students — school admin (and super admin)
router.post(
  "/bulk",
  requireRole(ROLES.SCHOOL_ADMIN),
  studentsController.bulkCreate
);

// Create single student — school admin (and super admin)
router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createStudentSchema),
  studentsController.create
);

router.get("/:id", validateQuery(studentIdParam, "params"), studentsController.get);

// Update — school admin full update; teacher correction-only.
router.put(
  "/:id",
  validateQuery(studentIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  (req, res, next) => {
    const schema = req.user.role === ROLES.TEACHER ? teacherCorrectSchema : updateStudentSchema;
    return validate(schema)(req, res, next);
  },
  studentsController.update
);

// Delete + password reset — school admin only.
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