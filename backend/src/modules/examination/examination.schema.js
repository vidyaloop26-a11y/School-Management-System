const { z } = require("zod");

const examMarkItemSchema = z.object({
  studentId: z.string(),
  marksObtained: z.number().min(0).max(100),
  maxMarks: z.number().default(100),
  remarks: z.string().optional(),
});

const saveExamMarksSchema = z.object({
  session: z.string().default("2024-2025"),
  term: z.string().default("Mid-Term"),
  cls: z.string(),
  section: z.string(),
  subject: z.string(),
  marks: z.array(examMarkItemSchema),
});

module.exports = {
  saveExamMarksSchema,
};
