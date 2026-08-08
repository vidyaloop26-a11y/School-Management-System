const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const attendanceController = require("./attendance.controller");
const { bulkSchema, classQuerySchema, studentQuerySchema } = require("./attendance.schema");

router.use(authenticate);

// Everyone authenticated may read the class roster & parent may view own child.
router.get("/", validateQuery(classQuerySchema), attendanceController.getByClass);
router.get(
  "/student",
  validateQuery(studentQuerySchema),
  attendanceController.getForStudent
);

// Marking attendance: school admin or teacher.
router.post(
  "/mark",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  validate(bulkSchema),
  attendanceController.mark
);

module.exports = router;