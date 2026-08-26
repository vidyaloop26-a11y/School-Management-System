const express = require("express");
const controller = require("./support.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { validate, validateQuery } = require("../../middleware/validate");
const { findStudentSchema, schoolIdParam } = require("./support.schema");

const router = express.Router();

// The support wall: superAdmin (the platform provider) may see platform
// aggregates and run audited targeted lookups — nothing else. Every route in
// this module is superAdmin-only and audit-logged.
router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get("/stats", controller.stats);
router.get("/schools", controller.schoolsSummary);
router.get("/school/:id", validateQuery(schoolIdParam, "params"), controller.schoolProfile);
router.post("/find-student", validate(findStudentSchema), controller.findStudent);

module.exports = router;
