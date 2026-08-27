const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const frontOfficeController = require("./frontoffice.controller");
const {
  checkInVisitorSchema,
  createGatePassSchema,
  createHostMappingSchema,
  visitorQuerySchema,
  visitorIdParam,
} = require("./frontoffice.schema");

router.use(authenticate);

// Visitors
router.get("/visitors", validateQuery(visitorQuerySchema), frontOfficeController.getVisitors);
router.post(
  "/visitors/check-in",
  requireDuty("frontOffice"),
  validate(checkInVisitorSchema),
  frontOfficeController.checkIn
);
router.post(
  "/visitors/:id/check-out",
  requireDuty("frontOffice"),
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.checkOut
);

// Gate passes
router.get("/gate-passes", frontOfficeController.getGatePasses);
router.post(
  "/gate-passes",
  requireDuty("frontOffice"),
  validate(createGatePassSchema),
  frontOfficeController.createGatePass
);

// Host mappings
router.get("/host-mappings", frontOfficeController.getHostMappings);
router.post(
  "/host-mappings",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createHostMappingSchema),
  frontOfficeController.createHostMapping
);
router.delete(
  "/host-mappings/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.deleteHostMapping
);

module.exports = router;
