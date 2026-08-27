const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const copyCheckingController = require("./copychecking.controller");
const {
  createBatchSchema,
  addEntrySchema,
  updateEntrySchema,
  batchQuerySchema,
} = require("./copychecking.schema");

router.use(authenticate);

router.get("/", validateQuery(batchQuerySchema), copyCheckingController.getBatches);
router.get("/:id", copyCheckingController.getBatchById);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("teacher", "hod", "principal", "examCoordinator"),
  validate(createBatchSchema),
  copyCheckingController.createBatch
);

router.post(
  "/:batchId/entries",
  validate(addEntrySchema),
  copyCheckingController.addEntry
);

router.put(
  "/entries/:entryId",
  validate(updateEntrySchema),
  copyCheckingController.updateEntry
);

router.delete(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  copyCheckingController.deleteBatch
);

module.exports = router;
