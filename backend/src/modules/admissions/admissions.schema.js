const { z } = require("zod");

const STAGES = ["inquiry", "docs", "interaction", "enrolled", "rejected"];
const STATUSES = ["Active", "Inactive"];

const inquiryBase = {
  name: z.string().min(1, "Student name is required"),
  classApplied: z.string().min(1, "Class is required"),
  parentName: z.string().min(1, "Parent/guardian name is required"),
  phone: z.string().min(1, "Contact number is required"),
  email: z.string().email().optional().or(z.literal("").optional()),
  prevSchool: z.string().optional().or(z.literal("").optional()),
};

const createInquirySchema = z.object(inquiryBase);

const updateInquirySchema = z
  .object({
    ...inquiryBase,
    stage: z.enum(STAGES).optional(),
    status: z.enum(STATUSES).optional(),
  })
  .partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  classApplied: z.string().optional(),
  schoolId: z.string().optional(),
});

const inquiryIdParam = z.object({ id: z.string().min(1) });

const enrollSchema = z.object({
  section: z.string().min(1).optional(),
  roll: z.number().int().min(0).optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergency: z.string().optional(),
});

module.exports = {
  STAGES,
  STATUSES,
  createInquirySchema,
  updateInquirySchema,
  listQuerySchema,
  inquiryIdParam,
  enrollSchema,
};
