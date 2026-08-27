const { z } = require("zod");

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  currentStock: z.number().default(0),
  reorderLevel: z.number().default(10),
  unitPrice: z.number().default(0),
  unit: z.string().default("pcs"),
  location: z.string().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  reorderLevel: z.number().optional(),
  unitPrice: z.number().optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
});

const purchaseSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  vendorName: z.string().optional(),
  invoiceNo: z.string().optional(),
  totalCost: z.number().optional(),
});

const issueSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  department: z.string().optional(),
  issuedTo: z.string().optional(),
});

const inventoryQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  lowStock: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  purchaseSchema,
  issueSchema,
  inventoryQuerySchema,
};
