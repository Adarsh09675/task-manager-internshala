const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional().nullable(),
});

const updateRequestSchema = z.object({
  requestedTitle: z.string().trim().min(1).max(120),
  requestedDescription: z.string().trim().max(500).optional().default(""),
});

module.exports = { createTaskSchema, updateTaskSchema, updateRequestSchema };
