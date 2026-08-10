const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const timetableController = require("./timetable.controller");
const {
  bulkSchema,
  timetableQuerySchema,
  staffTimetableQuerySchema,
  entryIdParam,
} = require("./timetable.schema");

router.use(authenticate);

router.get("/", validateQuery(timetableQuerySchema), timetableController.getClass);
router.get("/teacher", validateQuery(staffTimetableQuerySchema), timetableController.getByTeacher);

// Writing: an admin responsibility (and super admin).
router.post(
  "/upsert",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(bulkSchema),
  timetableController.upsertClass
);
router.delete(
  "/:id",
  validateQuery(entryIdParam, "params"),
  requireRole(ROLES.SCHOOL_ADMIN),
  timetableController.removeEntry
);

module.exports = router;