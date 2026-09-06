const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireDuty, requireRole, ROLES } = require("../../middleware/rbac");
const diaryController = require("./diary.controller");
const { createDiaryEntrySchema, diaryQuerySchema } = require("./diary.schema");

router.use(authenticate);

router.get("/", validateQuery(diaryQuerySchema), diaryController.listEntries);

router.post(
  "/",
  requireDuty("teacher", "hod", "principal"),
  validate(createDiaryEntrySchema),
  diaryController.createEntry
);

module.exports = router;
