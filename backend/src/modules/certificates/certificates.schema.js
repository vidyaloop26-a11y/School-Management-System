const { z } = require("zod");
const { CERT_TYPES } = require("./certificates.service");

const issueCertificateSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(1, "studentName is required"),
  cls: z.string().optional(),
  section: z.string().optional(),
  type: z.enum(CERT_TYPES),
  certificateNo: z.string().optional(),
  issueDate: z.string().optional(),
  reason: z.string().max(500).optional(),
  conduct: z.string().max(200).optional(),
  remarks: z.string().max(500).optional(),
  schoolId: z.string().optional(),
});

const requestCertificateSchema = issueCertificateSchema.omit({
  certificateNo: true,
  issueDate: true,
  conduct: true,
});

module.exports = {
  CERT_TYPES,
  issueCertificateSchema,
  requestCertificateSchema,
};
