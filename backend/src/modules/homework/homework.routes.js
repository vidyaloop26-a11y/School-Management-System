const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const homeworkController = require("./homework.controller");
const {
  createHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
  homeworkQuerySchema,
} = require("./homework.schema");

router.use(authenticate);

router.get("/", validateQuery(homeworkQuerySchema), homeworkController.listHomework);

router.post(
  "/",
  requireDuty("teacher", "hod", "principal"),
  validate(createHomeworkSchema),
  homeworkController.createHomework
);

router.put("/:id", validate(updateHomeworkSchema), homeworkController.updateHomework);
router.delete(
  "/:id",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  homeworkController.deleteHomework
);

router.post(
  "/:id/submit",
  requireRole(ROLES.PARENT),
  validate(submitHomeworkSchema),
  homeworkController.submitHomework
);

router.get("/:id/submissions", homeworkController.getSubmissions);

module.exports = router;
