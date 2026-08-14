const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const examinationController = require("./examination.controller");
const {
  bulkExamMarksSchema,
  listExamMarksQuerySchema,
  studentReportQuerySchema,
} = require("./examination.schema");

router.use(authenticate);

// View Class Examination Marks Roster — authenticated users (admin, teacher, parent)
router.get("/", validateQuery(listExamMarksQuerySchema), examinationController.getRoster);

// View Student Individual Report Card & Grade Sheet — admin, teacher, parent
router.get(
  "/report-card",
  validateQuery(studentReportQuerySchema),
  examinationController.getReportCard
);

// Save / Enter / Update Examination Marks — School Admin or Teacher only
router.post(
  "/marks",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  validate(bulkExamMarksSchema),
  examinationController.saveMarks
);

module.exports = router;
