const { z } = require("zod");

const optionalString = z.string().nullable().optional().or(z.literal(""));

const markItemSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  subject: z.string().min(1, "Subject is required"),
  marksObtained: z.number().min(0, "Marks must be 0 or greater"),
  maxMarks: z.number().min(1).default(100),
  grade: optionalString,
  remarks: optionalString,
});

const bulkExamMarksSchema = z.object({
  session: z.string().default("2024-2025"),
  term: z.string().default("Mid-Term"),
  cls: z.string().min(1),
  section: z.string().min(1),
  marks: z.array(markItemSchema).min(1, "Please provide at least one student mark item"),
});

const listExamMarksQuerySchema = z.object({
  session: z.string().optional(),
  term: z.string().optional(),
  cls: z.string().optional(),
  section: z.string().optional(),
  subject: z.string().optional(),
});

const studentReportQuerySchema = z.object({
  studentId: z.string().optional(),
  session: z.string().optional(),
  term: z.string().optional(),
});

module.exports = {
  bulkExamMarksSchema,
  listExamMarksQuerySchema,
  studentReportQuerySchema,
};
