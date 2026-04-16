const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(100),
  role: z.enum(["user", "admin"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(100),
});

module.exports = { registerSchema, loginSchema };
