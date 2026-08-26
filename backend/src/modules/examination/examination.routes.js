const express = require("express");
const router = express.Router();
const examController = require("./examination.controller");
const { authenticate } = require("../../middleware/auth");
const { requireDuty, rejectRoles, ROLES } = require("../../middleware/rbac");
const { validate } = require("../../middleware/validate");
const { saveExamMarksSchema } = require("./examination.schema");

router.use(authenticate);

router.get("/", rejectRoles(ROLES.SUPER_ADMIN), examController.getRoster);
router.post(
  "/marks",
  requireDuty("teacher", "examCoordinator", "hod"),
  validate(saveExamMarksSchema),
  examController.saveMarks
);
router.get("/report-card", rejectRoles(ROLES.SUPER_ADMIN), examController.getReportCard);

module.exports = router;
