const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireDuty } = require("../../middleware/rbac");
const admissionsController = require("./admissions.controller");
const {
  createInquirySchema,
  updateInquirySchema,
  listQuerySchema,
  inquiryIdParam,
  enrollSchema,
} = require("./admissions.schema");

// Admins plus staff carrying admissions duties (front desk + admissions officer).
router.use(authenticate, requireDuty("frontOffice", "admissionsOfficer"));

router.get("/", validateQuery(listQuerySchema), admissionsController.list);
router.post("/", validate(createInquirySchema), admissionsController.create);
router.get("/:id", validateQuery(inquiryIdParam, "params"), admissionsController.get);
router.put(
  "/:id",
  validateQuery(inquiryIdParam, "params"),
  validate(updateInquirySchema),
  admissionsController.update
);
router.delete(
  "/:id",
  validateQuery(inquiryIdParam, "params"),
  admissionsController.remove
);

// Convert an inquiry into a real Student + parent login account.
router.post(
  "/:id/enroll",
  validateQuery(inquiryIdParam, "params"),
  validate(enrollSchema),
  admissionsController.enroll
);

module.exports = router;
