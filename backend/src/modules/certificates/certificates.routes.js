const express = require("express");
const controller = require("./certificates.controller");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listCertificates);
router.post("/issue", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER), controller.issueCertificate);
router.post("/request", controller.issueCertificate);

module.exports = router;
