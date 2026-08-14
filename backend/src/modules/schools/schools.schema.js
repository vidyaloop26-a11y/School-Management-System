const { z } = require("zod");

const createSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, - and _"),
  board: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  session: z.string().optional(),
  adminName: z.string().optional().or(z.literal("").transform(() => undefined)),
  adminEmail: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  adminPassword: z.string().min(6).optional().or(z.literal("").transform(() => undefined)),
});

const updateSchoolSchema = createSchoolSchema
  .partial()
  .omit({ code: true, adminName: true, adminEmail: true, adminPassword: true });

const schoolIdParam = z.object({ id: z.string().min(1) });

module.exports = { createSchoolSchema, updateSchoolSchema, schoolIdParam };