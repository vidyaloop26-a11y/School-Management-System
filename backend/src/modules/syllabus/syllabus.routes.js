const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const syllabusController = require("./syllabus.controller");
const {
  createTopicSchema,
  updateTopicSchema,
  markProgressSchema,
  syllabusQuerySchema,
} = require("./syllabus.schema");

router.use(authenticate);

router.get("/", validateQuery(syllabusQuerySchema), syllabusController.getTopics);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createTopicSchema),
  syllabusController.createTopic
);

router.put(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(updateTopicSchema),
  syllabusController.updateTopic
);

router.post(
  "/:id/progress",
  requireDuty("teacher", "hod", "principal"),
  validate(markProgressSchema),
  syllabusController.markCompleted
);

router.get("/dashboard", syllabusController.getPaceDashboard);

module.exports = router;
