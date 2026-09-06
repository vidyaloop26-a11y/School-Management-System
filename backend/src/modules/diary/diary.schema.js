const { z } = require("zod");

const createDiaryEntrySchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  subject: z.string().min(1),
  note: z.string().min(1),
  homework: z.string().optional(),
});

const diaryQuerySchema = z.object({
  cls: z.string().optional(),
  section: z.string().optional(),
  subject: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

module.exports = {
  createDiaryEntrySchema,
  diaryQuerySchema,
};
