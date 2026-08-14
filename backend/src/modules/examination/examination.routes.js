const express = require("express");
const router = express.Router();
const examController = require("./examination.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { validate } = require("../../middleware/validate");
const { saveExamMarksSchema } = require("./examination.schema");

router.use(authenticate);

router.get("/", examController.getRoster);
router.post(
  "/marks",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  validate(saveExamMarksSchema),
  examController.saveMarks
);
router.get("/report-card", examController.getReportCard);

module.exports = router;
