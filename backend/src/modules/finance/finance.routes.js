const express = require("express");
const controller = require("./finance.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listRecords);
router.post("/", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), controller.createRecord);

module.exports = router;
