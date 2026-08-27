const { z } = require("zod");

const createTopicSchema = z.object({
  subject: z.string().min(1),
  cls: z.string().min(1),
  section: z.string().min(1),
  topicName: z.string().min(1),
  targetDate: z.string().optional(),
});

const updateTopicSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BEHIND"]).optional(),
  targetDate: z.string().optional(),
});

const markProgressSchema = z.object({
  notes: z.string().optional(),
});

const syllabusQuerySchema = z.object({
  cls: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
});

module.exports = {
  createTopicSchema,
  updateTopicSchema,
  markProgressSchema,
  syllabusQuerySchema,
};
