const express = require("express");
const controller = require("./certificates.controller");
const { authenticate } = require("../../middleware/auth");
const { requireDuty } = require("../../middleware/rbac");
const { validate } = require("../../middleware/validate");
const {
  issueCertificateSchema,
  requestCertificateSchema,
} = require("./certificates.schema");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listCertificates);
// Issuing burns a serial number and is an administrative action.
router.post(
  "/issue",
  requireDuty("teacher"),
  validate(issueCertificateSchema),
  controller.issueCertificate
);
// Any authenticated member of the school can REQUEST a certificate;
// it enters the queue as REQUESTED until an admin issues it.
router.post("/request", validate(requestCertificateSchema), controller.requestCertificate);

module.exports = router;
