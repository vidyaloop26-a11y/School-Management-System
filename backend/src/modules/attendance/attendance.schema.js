const { z } = require("zod");

const STATUS = ["P", "A", "L"];

const markRowSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(STATUS),
});

const bulkSchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  attendance: z.array(markRowSchema).max(500).optional(),
  marks: z.array(markRowSchema).max(500).optional(),
  schoolId: z.string().optional(),
});

const classQuerySchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  schoolId: z.string().optional(),
});

// For clear/audit of a SPECIFIC day — date is mandatory so we never wipe a whole
// class's history by accident.
const dayQuerySchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  schoolId: z.string().optional(),
});

const studentQuerySchema = z.object({
  studentId: z.string().optional(), // omitted = the caller's own linked child (parent)
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

module.exports = { STATUS, markRowSchema, bulkSchema, classQuerySchema, studentQuerySchema, dayQuerySchema };