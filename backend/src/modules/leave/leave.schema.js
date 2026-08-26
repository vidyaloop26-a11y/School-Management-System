const { z } = require("zod");

const LEAVE_TYPES = [
  "Casual",
  "Sick",
  "Privilege",
  "Maternity",
  "Emergency",
  "Half Day",
];

const dateInput = z.union([z.string().min(4), z.date()]);

const applyLeaveSchema = z.object({
  applicantType: z.enum(["STAFF", "STUDENT"]).optional(),
  applicantId: z.string().optional(),
  applicantName: z.string().optional(),
  roleOrClass: z.string().optional(),
  leaveType: z.enum(LEAVE_TYPES).optional(),
  startDate: dateInput,
  endDate: dateInput,
  halfDay: z.boolean().optional(),
  reason: z.string().max(1000).optional(),
  schoolId: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(500).optional(),
});

const leaveIdParam = z.object({ id: z.string().min(1) });

const listLeavesQuerySchema = z.object({
  applicantType: z.enum(["STAFF", "STUDENT"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  schoolId: z.string().optional(),
});

module.exports = {
  LEAVE_TYPES,
  applyLeaveSchema,
  updateLeaveStatusSchema,
  leaveIdParam,
  listLeavesQuerySchema,
};
