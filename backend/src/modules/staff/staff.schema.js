const { z } = require("zod");

const optionalString = z.string().nullable().optional().or(z.literal(""));
const optionalEmail = z.union([z.string().email(), z.literal(""), z.null(), z.undefined()]);

const staffBase = {
  staffId: z.string().min(1, "Staff ID is required"),
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  dept: optionalString,
  subject: optionalString,
  qualification: optionalString,
  phone: optionalString,
  email: optionalEmail,
  joined: optionalString,
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  schoolId: optionalString,
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