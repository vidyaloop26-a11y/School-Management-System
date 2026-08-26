const { z } = require("zod");

const PAYMENT_MODES = ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"];

const listPayrollQuerySchema = z.object({
  month: z.string().optional(),
  status: z.enum(["PAID", "PENDING", "PROCESSING"]).optional(),
  schoolId: z.string().optional(),
});

const staffPayItemSchema = z.object({
  // Either the Staff document id or the human staffId code must be present.
  id: z.string().min(1).optional(),
  staffId: z.string().min(1).optional(),
  staffName: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  jobTitle: z.string().optional(),
  basicSalary: z.number().positive("basicSalary must be positive"),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
});

const processPayrollSchema = z.object({
  month: z.string().min(3, "month is required (e.g. 'August 2026')"),
  staffMembers: z.array(staffPayItemSchema).min(1).max(200),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
  remarks: z.string().max(300).optional(),
  markPaid: z.boolean().optional(),
  schoolId: z.string().optional(),
});

module.exports = {
  PAYMENT_MODES,
  listPayrollQuerySchema,
  processPayrollSchema,
};
