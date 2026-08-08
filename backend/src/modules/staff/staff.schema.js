const { z } = require("zod");

const staffBase = {
  staffId: z.string().min(1, "Staff ID is required"),
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  dept: z.string().optional(),
  subject: z.string().optional(),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  joined: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
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

module.exports = { createStaffSchema, updateStaffSchema, listQuerySchema, staffIdParam };