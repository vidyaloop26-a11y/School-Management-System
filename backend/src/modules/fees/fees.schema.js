const { z } = require("zod");

const createComponentSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  type: z.string().default("Annual"),
});

const createStructureSchema = z.object({
  cls: z.string().min(1),
  session: z.string().default("2024-2025"),
  amount: z.number().min(0),
});

const createLedgerSchema = z.object({
  studentId: z.string().min(1),
  session: z.string().default("2024-2025"),
  term: z.string().min(1),
  amount: z.number().min(0),
  dueDate: z.coerce.date(),
});

const createLedgerBulkSchema = z.object({
  cls: z.string().min(1),
  section: z.string().optional(),
  term: z.string().min(1),
  amount: z.number().min(0),
  dueDate: z.coerce.date(),
  session: z.string().default("2024-2025"),
});

const recordPaymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive(),
  paymentMode: z.string().default("CASH"),
  ledgerId: z.string().optional(),
});

const feeQuerySchema = z.object({
  cls: z.string().optional(),
  section: z.string().optional(),
  session: z.string().optional(),
  term: z.string().optional(),
  status: z.string().optional(),
  studentId: z.string().optional(),
});

module.exports = {
  createComponentSchema,
  createStructureSchema,
  createLedgerSchema,
  createLedgerBulkSchema,
  recordPaymentSchema,
  feeQuerySchema,
};
