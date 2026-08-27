const router = require("express").Router();
const { validate } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const settingsController = require("./settings.controller");
const { updateSettingsSchema, eventSchema, eventIdParam } = require("./settings.schema");

router.use(authenticate);

// Settings
router.get("/", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.getSettings);
router.put("/", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), validate(updateSettingsSchema), settingsController.updateSettings);

// Events & Holidays
router.get("/events", settingsController.listEvents);
router.post("/events", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), validate(eventSchema), settingsController.createEvent);
router.delete("/events/:id", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.deleteEvent);
router.post("/sync-holidays", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.syncHolidays);

// Subjects
router.get("/subjects", settingsController.listSubjects);
router.post("/subjects", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.createSubject);
router.delete("/subjects/:id", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.deleteSubject);
router.put("/subjects/reorder", requireRole(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN), settingsController.reorderSubjects);

module.exports = router;
