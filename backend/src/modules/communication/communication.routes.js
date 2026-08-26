const router = require("express").Router();
const { validate } = require("../../middleware/validate");
const { validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const communicationController = require("./communication.controller");
const {
  createNoticeSchema,
  updateNoticeSchema,
  listQuerySchema,
  noticeIdParam,
} = require("./communication.schema");

router.use(authenticate);

router.get("/", validateQuery(listQuerySchema), communicationController.list);
router.post(
  "/",
  requireDuty("teacher", "principal", "vicePrincipal", "hod"),
  validate(createNoticeSchema),
  communicationController.create
);
router.get("/:id", validateQuery(noticeIdParam, "params"), communicationController.get);
router.put(
  "/:id",
  requireDuty("teacher", "principal", "vicePrincipal", "hod"),
  validateQuery(noticeIdParam, "params"),
  validate(updateNoticeSchema),
  communicationController.update
);
router.delete(
  "/:id",
  requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  validateQuery(noticeIdParam, "params"),
  communicationController.remove
);

module.exports = router;
