const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireDuty } = require("../../middleware/rbac");
const frontOfficeController = require("./frontoffice.controller");
const {
  checkInVisitorSchema,
  publicCheckInSchema,
  approveVisitorSchema,
  verifyPickupSchema,
  createGatePassSchema,
  createGuardianSchema,
  updateGuardianSchema,
  createHostMappingSchema,
  visitorQuerySchema,
  gatePassQuerySchema,
  notificationQuerySchema,
  visitorIdParam,
  schoolIdQuery,
  qQuery,
  gatePassVerifyQuery,
  publicIdParam,
} = require("./frontoffice.schema");

// ---------------------------------------------------------------------------
// Public kiosk / QR endpoints — no auth. The visitor scans the gate QR, fills
// the self check-in form and, later, the gate staff verify their QR pass.
// ---------------------------------------------------------------------------
router.get(
  "/public/config",
  validateQuery(schoolIdQuery),
  frontOfficeController.getPublicConfig
);
router.get(
  "/public/students",
  validateQuery(qQuery),
  frontOfficeController.searchPublicStudents
);
router.get(
  "/public/visitors/:id/status",
  validateQuery(publicIdParam, "params"),
  frontOfficeController.getPublicVisitorStatus
);
router.post(
  "/public/check-in",
  validate(publicCheckInSchema),
  frontOfficeController.publicCheckIn
);
router.get(
  "/public/gate-passes/verify",
  validateQuery(gatePassVerifyQuery),
  frontOfficeController.verifyGatePass
);

// ---------------------------------------------------------------------------
// Authenticated endpoints below.
// ---------------------------------------------------------------------------
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
router.post(
  "/visitors/:id/approve",
  requireDuty("frontOffice", "principal", "vicePrincipal"),
  validateQuery(visitorIdParam, "params"),
  validate(approveVisitorSchema),
  frontOfficeController.approveVisitor
);
router.post(
  "/visitors/:id/verify-pickup",
  requireDuty("frontOffice", "principal", "vicePrincipal"),
  validateQuery(visitorIdParam, "params"),
  validate(verifyPickupSchema),
  frontOfficeController.verifyPickup
);

// Gate passes
router.get(
  "/gate-passes",
  validateQuery(gatePassQuerySchema),
  frontOfficeController.getGatePasses
);
router.get(
  "/gate-passes/:id",
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.getGatePassById
);
router.post(
  "/gate-passes",
  requireDuty("frontOffice"),
  validate(createGatePassSchema),
  frontOfficeController.createGatePass
);
router.post(
  "/gate-passes/:id/cancel",
  requireDuty("frontOffice"),
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.cancelGatePass
);

// Guardians (authorised pickup list)
router.get("/guardians", frontOfficeController.getGuardians);
router.post(
  "/guardians",
  requireDuty("frontOffice"),
  validate(createGuardianSchema),
  frontOfficeController.createGuardian
);
router.put(
  "/guardians/:id",
  requireDuty("frontOffice"),
  validateQuery(visitorIdParam, "params"),
  validate(updateGuardianSchema),
  frontOfficeController.updateGuardian
);
router.delete(
  "/guardians/:id",
  requireDuty("frontOffice"),
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.deleteGuardian
);

// In-app notifications
router.get(
  "/notifications",
  validateQuery(notificationQuerySchema),
  frontOfficeController.getNotifications
);
router.post(
  "/notifications/read-all",
  frontOfficeController.markAllNotificationsRead
);
router.post(
  "/notifications/:id/read",
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.markNotificationRead
);

// Host mappings
router.get("/host-mappings", frontOfficeController.getHostMappings);
router.post(
  "/host-mappings",
  requireDuty("frontOffice", "warden"),
  validate(createHostMappingSchema),
  frontOfficeController.createHostMapping
);
router.delete(
  "/host-mappings/:id",
  requireDuty("frontOffice", "warden"),
  validateQuery(visitorIdParam, "params"),
  frontOfficeController.deleteHostMapping
);

module.exports = router;