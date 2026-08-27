const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const hostelController = require("./hostel.controller");
const {
  createBuildingSchema,
  createRoomSchema,
  assignBedSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  hostelQuerySchema,
} = require("./hostel.schema");

router.use(authenticate);

// Buildings
router.get("/buildings", hostelController.listBuildings);
router.post(
  "/buildings",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(createBuildingSchema),
  hostelController.addBuilding
);
router.put(
  "/buildings/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(createBuildingSchema.partial()),
  hostelController.editBuilding
);
router.delete(
  "/buildings/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  hostelController.removeBuilding
);

// Rooms
router.get("/rooms", validateQuery(hostelQuerySchema), hostelController.listRooms);
router.post(
  "/rooms",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(createRoomSchema),
  hostelController.addRoom
);

// Bed assignments
router.post(
  "/assign",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(assignBedSchema),
  hostelController.assignStudent
);
router.delete(
  "/assign/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  hostelController.removeAssignment
);

// Maintenance
router.get("/maintenance", validateQuery(hostelQuerySchema), hostelController.listMaintenance);
router.post(
  "/maintenance",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(createMaintenanceSchema),
  hostelController.addMaintenance
);
router.put(
  "/maintenance/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("warden"),
  validate(updateMaintenanceSchema),
  hostelController.editMaintenance
);

module.exports = router;
