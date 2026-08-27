const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const tasksController = require("./tasks.controller");
const {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} = require("./tasks.schema");

router.use(authenticate);

router.get("/", validateQuery(taskQuerySchema), tasksController.getTasks);
router.get("/:id", tasksController.getTaskById);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("teacher", "hod", "principal"),
  validate(createTaskSchema),
  tasksController.createTask
);

router.put(
  "/:id",
  validate(updateTaskSchema),
  tasksController.updateTask
);

router.delete(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  tasksController.deleteTask
);

module.exports = router;
