const { z } = require("zod");

const periodSchema = z.object({
  label: z.string().min(1),
  time: z.string().min(1),
});

const updateSettingsSchema = z.object({
  academicSession: z.string().optional(),
  term: z.number().int().min(1).max(4).optional(),
  grading: z.string().optional(),
  days: z.array(z.string()).min(1).max(7).optional(),
  periods: z.array(periodSchema).min(1).max(12).optional(),
}).strict();

const eventSchema = z.object({
  title: z.string().min(1),
  sub: z.string().optional(),
  date: z.string().min(1),
  type: z.enum(["Event", "Holiday"]).default("Event"),
}).strict();

const eventIdParam = z.object({ id: z.string().min(1) });

module.exports = { updateSettingsSchema, eventSchema, eventIdParam };
