const { z } = require("zod");

const checkInVisitorSchema = z.object({
  name: z.string().min(1, "Visitor name is required"),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  organisation: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  hostStaffId: z.string().optional(),
  hostStaffName: z.string().optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  admissionClass: z.string().optional(),
  email: z.string().optional(),
});

const publicCheckInSchema = checkInVisitorSchema.extend({
  schoolId: z.string().min(1, "School is required"),
});

const approveVisitorSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "WAIT"]),
  note: z.string().optional(),
});

const verifyPickupSchema = z.object({
  decision: z.enum(["VERIFIED", "UNAUTHORIZED", "MANUAL"]),
  note: z.string().optional(),
});

const createGatePassSchema = z.object({
  visitorId: z.string().optional(),
  passType: z.enum(["VISITOR", "STUDENT", "STAFF"]).default("VISITOR"),
  holderId: z.string().optional(),
  holderName: z.string().optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  purpose: z.string().optional().or(z.literal("").optional()),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  validUntil: z.string().optional(),
});

const createGuardianSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  name: z.string().min(1, "Guardian name is required"),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  authorizedForPickup: z.boolean().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

const updateGuardianSchema = createGuardianSchema.partial();

const createHostMappingSchema = z.object({
  visitType: z.string().min(1, "Visit type is required"),
  notifyStaffId: z.string().min(1, "Notify staff ID is required"),
});

const visitorQuerySchema = z.object({
  status: z.string().optional(),
  approval: z.string().optional(),
  pickup: z.string().optional(),
  date: z.string().optional(),
});

const gatePassQuerySchema = z.object({
  passType: z.string().optional(),
  status: z.string().optional(),
});

const notificationQuerySchema = z.object({
  limit: z.string().optional(),
});

const visitorIdParam = z.object({ id: z.string().min(1) });

const schoolIdQuery = z.object({
  schoolId: z.string().min(1, "School is required"),
});

const qQuery = z.object({
  schoolId: z.string().min(1, "School is required"),
  q: z.string().optional(),
});

const gatePassVerifyQuery = z.object({
  token: z.string().min(1, "QR token is required"),
});

const publicIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  checkInVisitorSchema,
  publicCheckInSchema,
  approveVisitorSchema,
  verifyPickupSchema,
  createGatePassSchema,
  createGuardianSchema,
  updateGuardianSchema,
  createHostMappingSchema,
  visitorQuerySchema,
  gatePassQuerySchema,
  notificationQuerySchema,
  visitorIdParam,
  schoolIdQuery,
  qQuery,
  gatePassVerifyQuery,
  publicIdParam,
};