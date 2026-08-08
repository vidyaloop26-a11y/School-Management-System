const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/rbac");
const schoolsController = require("./schools.controller");
const { createSchoolSchema, updateSchoolSchema, schoolIdParam } = require("./schools.schema");

// Only the super admin can create/manage schools.
router.use(authenticate, requireRole("superAdmin"));

router.get("/", schoolsController.listSchools);
router.post("/", validate(createSchoolSchema), schoolsController.createSchool);
router.get("/:id", validateQuery(schoolIdParam, "params"), schoolsController.getSchool);
router.put("/:id", validateQuery(schoolIdParam, "params"), validate(updateSchoolSchema), schoolsController.updateSchool);
router.delete("/:id", validateQuery(schoolIdParam, "params"), schoolsController.deleteSchool);

module.exports = router;