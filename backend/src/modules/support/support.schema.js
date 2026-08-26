const { z } = require("zod");

const findStudentSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  email: z.string().email("A valid email is required"),
});

const schoolIdParam = z.object({ id: z.string().min(1) });

module.exports = { findStudentSchema, schoolIdParam };
