const { z } = require("zod");

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const CATEGORIES = ["GENERAL", "ACADEMIC", "ADMIN", "MAINTENANCE"];

const checklistItemSchema = z.object({
  text: z.string().min(1),
  done: z.boolean().default(false),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  category: z.enum(CATEGORIES).optional(),
  checklist: z.array(checklistItemSchema).optional(),
});

const updateTaskSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

const taskQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
});

module.exports = {
  PRIORITIES,
  STATUSES,
  CATEGORIES,
  checklistItemSchema,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
};
