const { z } = require("zod");

const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

const createBatchSchema = z.object({
  subject: z.string().min(1),
  cls: z.string().min(1),
  section: z.string().min(1),
  term: z.string().min(1),
  totalCopies: z.number().int().min(1),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

const addEntrySchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().optional(),
  marks: z.number().min(0).optional(),
  maxMarks: z.number().min(1).default(100),
});

const updateEntrySchema = z.object({
  marks: z.number().min(0).optional(),
  maxMarks: z.number().min(1).optional(),
});

const batchQuerySchema = z.object({
  cls: z.string().optional(),
  section: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  assignedToId: z.string().optional(),
});

module.exports = {
  STATUSES,
  createBatchSchema,
  addEntrySchema,
  updateEntrySchema,
  batchQuerySchema,
};
