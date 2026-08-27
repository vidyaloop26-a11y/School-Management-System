const { z } = require("zod");

const checkInVisitorSchema = z.object({
  name: z.string().min(1, "Visitor name is required"),
  phone: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  hostStaffId: z.string().optional(),
  hostStaffName: z.string().optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
});

const checkOutVisitorSchema = z.object({});

const createGatePassSchema = z.object({
  visitorId: z.string().min(1, "Visitor ID is required"),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  purpose: z.string().optional(),
});

const createHostMappingSchema = z.object({
  visitType: z.string().min(1, "Visit type is required"),
  notifyStaffId: z.string().min(1, "Notify staff ID is required"),
});

const visitorQuerySchema = z.object({
  status: z.string().optional(),
  date: z.string().optional(),
});

const visitorIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  checkInVisitorSchema,
  checkOutVisitorSchema,
  createGatePassSchema,
  createHostMappingSchema,
  visitorQuerySchema,
  visitorIdParam,
};
