const { z } = require("zod");

const createHomeworkSchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
});

const updateHomeworkSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  subject: z.string().optional(),
});

const submitHomeworkSchema = z.object({
  studentId: z.string().min(1),
  notes: z.string().optional(),
  status: z.string().default("Submitted"),
});

const homeworkQuerySchema = z.object({
  cls: z.string().optional(),
  section: z.string().optional(),
  subject: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

module.exports = {
  createHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
  homeworkQuerySchema,
};
