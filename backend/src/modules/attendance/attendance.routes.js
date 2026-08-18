const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const attendanceController = require("./attendance.controller");
const { bulkSchema, classQuerySchema, studentQuerySchema, dayQuerySchema } = require("./attendance.schema");

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

// Attendance audit — which teacher marked which class and when.
router.get(
  "/markers",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  validateQuery(dayQuerySchema),
  attendanceController.markers
);

// Clear a day's attendance (delete records for a specific class/section/date).
router.delete(
  "/clear",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  validateQuery(dayQuerySchema),
  attendanceController.clear
);

module.exports = router;