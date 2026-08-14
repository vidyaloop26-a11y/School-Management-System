const { z } = require("zod");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5", "BREAK"];

const entrySchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  day: z.enum(DAYS),
  period: z.enum(PERIODS),
  subject: z.string().min(1),
  room: z.string().optional(),
  staffId: z.string().optional(),
});

const bulkSchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
  entries: z.array(
    entrySchema.omit({ cls: true, section: true })
  ).min(1),
});

const timetableQuerySchema = z.object({
  cls: z.string().min(1),
  section: z.string().min(1),
});

const staffTimetableQuerySchema = z.object({
  staffId: z.string().optional(),
});

const entryIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  DAYS,
  PERIODS,
  entrySchema,
  bulkSchema,
  timetableQuerySchema,
  staffTimetableQuerySchema,
  entryIdParam,
};