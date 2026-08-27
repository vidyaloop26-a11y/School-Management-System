const { z } = require("zod");

const createBookSchema = z.object({
  title: z.string().min(1),
  isbn: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  totalCopies: z.number().int().positive().default(1),
  location: z.string().optional(),
});

const issueBookSchema = z.object({
  bookId: z.string().min(1),
  studentId: z.string().optional(),
  staffId: z.string().optional(),
  dueDate: z.string().min(1),
});

const returnBookSchema = z.object({
  fineAmount: z.number().min(0).default(0),
});

const libraryQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

module.exports = {
  createBookSchema,
  issueBookSchema,
  returnBookSchema,
  libraryQuerySchema,
};
