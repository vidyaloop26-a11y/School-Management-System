const { z } = require("zod");

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const bootstrapSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = { loginSchema, bootstrapSchema, refreshSchema };