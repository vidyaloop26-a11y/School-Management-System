const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
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

// Marking attendance: class teachers (admins pass via duty override).
router.post(
  "/mark",
  requireDuty("teacher"),
  validate(bulkSchema),
  attendanceController.mark
);

// Attendance audit — which teacher marked which class and when.
router.get(
  "/markers",
  requireDuty("teacher"),
  validateQuery(dayQuerySchema),
  attendanceController.markers
);

// Clear a day's attendance — destructive, so admins only (teachers use /mark
// to correct individual students; wholesale wipes are audited admin actions).
router.delete(
  "/clear",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  validateQuery(dayQuerySchema),
  attendanceController.clear
);

module.exports = router;