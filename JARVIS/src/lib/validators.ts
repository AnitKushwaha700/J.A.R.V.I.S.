import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message must be under 2000 characters"),
  mode: z.enum([
    // Core Jarvis & coach modes
    "assistant",
    "english",
    "free-talk",
    "interview",
    "restaurant",
    "airport",
    "office",
    "college",
    "shopping",
    "debate",
    // Jarvis agent modes
    "coding-tutor",
    "career-advisor",
    "ai-teacher",
    "translator",
  ]),
  conversationId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        text: z.string(),
      })
    )
    .default([]),
  language: z.string().optional(), // e.g. "hi-IN", "en-US", "ta-IN"
  personality: z
    .enum(["professional", "friendly", "strict", "concise"])
    .optional()
    .default("professional"),
  responseLength: z
    .enum(["short", "balanced", "detailed"])
    .optional()
    .default("balanced"),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Task title is required").max(240),
  description: z.string().max(4000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueAt: z.string().datetime().optional().nullable(),
});

export const taskUpdateSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(4000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "completed", "skipped"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueAt: z.string().datetime().optional().nullable(),
});

export const memoryCreateSchema = z.object({
  category: z.enum(["preference", "career_goal", "learning_fact", "tech_skill", "mistake_pattern"]),
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(2000),
});
