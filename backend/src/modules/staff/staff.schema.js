const { z } = require("zod");
const { DUTIES } = require("../../middleware/rbac");

const staffBase = {
  staffId: z.string().min(1, "Staff ID is required"),
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  dept: z.string().optional(),
  subject: z.string().optional(),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  assignedClass: z.string().optional().or(z.literal("")).optional(),
  assignedSection: z.string().optional().or(z.literal("")).optional(),
  joined: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  salary: z.number().nonnegative().optional(),
  duties: z.array(z.enum(DUTIES)).max(DUTIES.length).optional(),
  schoolId: z.string().optional(),
};

const createStaffSchema = z.object(staffBase);

const updateStaffSchema = z.object(staffBase).partial().omit({ schoolId: true });

const listQuerySchema = z.object({
  search: z.string().optional(),
  dept: z.string().optional(),
  status: z.string().optional(),
  schoolId: z.string().optional(),
});

const staffIdParam = z.object({ id: z.string().min(1) });

const bulkCreateStaffSchema = z.object({
  staff: z.array(z.object(staffBase)).min(1, "staff array cannot be empty").max(500),
});

// Temporary-password regeneration by a school admin.
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72).optional(),
});

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  listQuerySchema,
  staffIdParam,
  bulkCreateStaffSchema,
  resetPasswordSchema,
};