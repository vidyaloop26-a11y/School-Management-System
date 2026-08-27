const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { ApiError } = require("../../lib/errors");
const transportController = require("./transport.controller");
const {
  createRouteSchema,
  updateRouteSchema,
  createVehicleSchema,
  updateVehicleSchema,
  assignStudentSchema,
  transportQuerySchema,
  idParam,
} = require("./transport.schema");

router.use(authenticate);

// OR gate: schoolAdmin (or superAdmin) OR staff carrying transportIncharge duty
const requireTransportManager = (req, res, next) => {
  const user = req.user;
  if (!user?.role) return next(new ApiError(401, "Authentication required"));
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SCHOOL_ADMIN) return next();
  if (user.role === ROLES.STAFF) {
    const held = Array.isArray(user.duties) ? user.duties : [];
    if (held.includes("transportIncharge")) return next();
  }
  return next(new ApiError(403, "You do not have permission to perform this action"));
};

// --- Routes ---
router.get(
  "/routes",
  validateQuery(transportQuerySchema),
  transportController.listRoutes
);
router.get(
  "/routes/:id",
  validateQuery(idParam, "params"),
  transportController.getRoute
);
router.post(
  "/routes",
  requireTransportManager,
  validate(createRouteSchema),
  transportController.createRoute
);
router.put(
  "/routes/:id",
  requireTransportManager,
  validateQuery(idParam, "params"),
  validate(updateRouteSchema),
  transportController.updateRoute
);
router.delete(
  "/routes/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validateQuery(idParam, "params"),
  transportController.deleteRoute
);

// --- Vehicles ---
router.get(
  "/vehicles",
  validateQuery(transportQuerySchema),
  transportController.listVehicles
);
router.post(
  "/vehicles",
  requireTransportManager,
  validate(createVehicleSchema),
  transportController.createVehicle
);
router.put(
  "/vehicles/:id",
  requireTransportManager,
  validateQuery(idParam, "params"),
  validate(updateVehicleSchema),
  transportController.updateVehicle
);
router.delete(
  "/vehicles/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validateQuery(idParam, "params"),
  transportController.deleteVehicle
);

// --- Student Assignments ---
router.post(
  "/assign",
  requireTransportManager,
  validate(assignStudentSchema),
  transportController.assignStudent
);
router.delete(
  "/assign/:id",
  requireTransportManager,
  validateQuery(idParam, "params"),
  transportController.removeStudent
);

module.exports = router;
