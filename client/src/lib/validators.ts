import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be under 1000 characters"),
  mode: z.enum([
    // English coach modes
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
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
