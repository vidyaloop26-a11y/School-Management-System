const router = require("express").Router();
const { validate } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const authController = require("./auth.controller");
const { loginSchema, bootstrapSchema, refreshSchema } = require("./auth.schema");

router.post("/bootstrap", validate(bootstrapSchema), authController.bootstrapSuperAdmin);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;