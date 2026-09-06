const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const schoolsController = require("./schools.controller");
const { createSchoolSchema, updateSchoolSchema, schoolIdParam } = require("./schools.schema");

router.use(authenticate);

// All authenticated roles may read school info (for layout headers, dashboards, and profile widgets).
router.get("/", schoolsController.listSchools);
router.get("/:id", validateQuery(schoolIdParam, "params"), schoolsController.getSchool);

// Only Super Admin can create, modify, or delete schools.
router.post("/", requireRole(ROLES.SUPER_ADMIN), validate(createSchoolSchema), schoolsController.createSchool);
router.put("/:id", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), validateQuery(schoolIdParam, "params"), validate(updateSchoolSchema), schoolsController.updateSchool);
router.delete("/:id", requireRole(ROLES.SUPER_ADMIN), validateQuery(schoolIdParam, "params"), schoolsController.deleteSchool);

module.exports = router;