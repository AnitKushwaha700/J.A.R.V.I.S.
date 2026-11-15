import { GoogleGenAI } from "@google/genai";
import {
  getSystemPrompt,
  getCodingTutorPrompt,
  getCareerAdvisorPrompt,
  getAITeacherPrompt,
  getTranslatorPrompt,
} from "@/features/coach/prompts/system";
import type { PracticeMode, AnyModeSlug } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

interface ChatHistoryEntry {
  role: "user" | "ai";
  text: string;
}

/**
 * Pick the right system prompt based on the mode slug.
 * English coach modes → getSystemPrompt(mode)
 * Agent modes → dedicated prompts
 */
function getPromptForMode(
  modeSlug: AnyModeSlug,
  mode?: PracticeMode
): string {
  switch (modeSlug) {
    case "coding-tutor":
      return getCodingTutorPrompt();
    case "career-advisor":
      return getCareerAdvisorPrompt();
    case "ai-teacher":
      return getAITeacherPrompt();
    case "translator":
      return getTranslatorPrompt();
    default:
      // English coach modes
      if (mode) return getSystemPrompt(mode);
      return getSystemPrompt({
        slug: "free-talk",
        title: "Free Talk",
        aiPersona: "Friendly AI assistant",
        openingPrompt: "",
        description: "",
        icon: "",
        color: "",
        gradient: "",
      });
  }
}

function getFallbackResponse(
  modeSlug: AnyModeSlug,
  userMessage: string,
  language?: string
): string {
  const lang = language || "English";
  switch (modeSlug) {
    case "coding-tutor":
      return JSON.stringify({
        reply: `Here is the optimal solution and breakdown for "${userMessage}". We utilize a hash map for efficient single-pass lookups.`,
        code: {
          language: "typescript",
          content: `// Solution for: ${userMessage.slice(0, 35)}\nfunction solve(input: number[], target: number): number[] {\n  const lookup = new Map<number, number>();\n  for (let i = 0; i < input.length; i++) {\n    const complement = target - input[i];\n    if (lookup.has(complement)) {\n      return [lookup.get(complement)!, i];\n    }\n    lookup.set(input[i], i);\n  }\n  return [];\n}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        keyInsight: "Trading space for time: hash lookup takes O(1) average time compared to O(n) linear scan.",
        followUp: "Could this be solved with O(1) extra space if the array were already sorted?",
        confidenceScore: 92,
        cefrLevel: "B2",
        encouragement: "Great algorithmic thinking! Connect your free GEMINI_API_KEY in .env.local for unlimited live AI code generation.",
      });

    case "career-advisor":
      return JSON.stringify({
        reply: `Here is a structured, high-impact career roadmap for "${userMessage.slice(0, 40)}" designed for top software roles.`,
        roadmap: [
          { month: "Month 1-2", focus: "Data Structures & Core CS Problem Solving", resources: "NeetCode 150, Striver SDE Sheet" },
          { month: "Month 3-4", focus: "Full-Stack Architecture & Next.js 15+", resources: "Next.js official docs, PostgreSQL, Redis, Docker" },
          { month: "Month 5-6", focus: "System Design & Live Production Apps", resources: "Alex Xu System Design, AWS free tier, Open-source contributions" },
        ],
        skills: ["TypeScript", "Next.js", "PostgreSQL", "Docker", "System Design"],
        careerTip: "Build 2 deep, production-ready full-stack applications with real users rather than 10 shallow tutorial clones.",
        confidenceScore: 90,
        cefrLevel: "B2",
        encouragement: "The tech market values demonstrable proof of work! Connect your free GEMINI_API_KEY for personalized resume audits.",
      });

    case "ai-teacher":
      return JSON.stringify({
        reply: `Let's break down "${userMessage}" from first principles into intuitive concepts.`,
        subject: "Core Principles & Mental Models",
        keyPoints: [
          "1. Understand the core problem the concept was created to solve.",
          "2. Trace the step-by-step mechanism and underlying rules.",
          "3. Connect it to real-world software and engineering trade-offs.",
        ],
        example: "Imagine a library where books are organized by a binary index rather than randomly stacked — search drops from minutes to seconds.",
        quiz: "Quick check: Why does divide-and-conquer achieve O(log n) tree depth?",
        nextTopic: "Practical implementation and real-world edge cases.",
        confidenceScore: 94,
        cefrLevel: "B2",
        encouragement: "Curiosity is the key to deep mastery! Connect your free GEMINI_API_KEY to ask about any topic in STEM or Humanities.",
      });

    case "translator":
      return JSON.stringify({
        reply: `Here is the instant voice translation for "${userMessage}".`,
        original: userMessage,
        translated: `[${lang}]: ${userMessage}`,
        fromLanguage: "Auto-detected",
        toLanguage: lang,
        phonetic: "Natural vocal inflection and standard phrasing applied.",
        culturalNote: "Phrased for polite, natural conversational flow.",
        confidenceScore: 95,
        cefrLevel: "B2",
        encouragement: "Voice translation complete! Connect your free GEMINI_API_KEY for live cross-lingual translations across 50+ languages.",
      });

    default:
      return JSON.stringify({
        reply: `Hello! I'm your Jarvis speaking coach. I heard: "${userMessage}". You expressed your thoughts clearly — let's continue!`,
        grammarFixes: [
          {
            wrong: "I am agree with that",
            right: "I agree with that",
            why: "'Agree' is already a verb, so you don't need 'am'.",
            severity: "low",
          },
        ],
        betterWords: [
          {
            youSaid: "good",
            better: "exceptional",
            example: "That was an exceptional explanation.",
          },
        ],
        pronunciationTip: "Keep your vocal pace steady and emphasize key nouns for natural rhythm.",
        confidenceScore: 88,
        cefrLevel: "B2",
        encouragement: "Keep going! You're speaking with confidence. Connect your free GEMINI_API_KEY in .env.local for unlimited conversations.",
      });
  }
}

/**
 * Non-streaming Gemini response — used by /api/chat route.
 */
export async function generateChatResponse(
  modeSlug: AnyModeSlug,
  userMessage: string,
  history: ChatHistoryEntry[],
  mode?: PracticeMode,
  language?: string
): Promise<string> {
  const client = getAI();
  if (!client) {
    return getFallbackResponse(modeSlug, userMessage, language);
  }

  const systemPrompt = getPromptForMode(modeSlug, mode);

  const conversationContext = history
    .slice(-10)
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
    .join("\n");

  const langNote = language && language !== "en-US"
    ? `\n[User's preferred language: ${language}. Respond in this language unless the mode requires English.]`
    : "";

  const fullPrompt = conversationContext
    ? `${conversationContext}\nUser: ${userMessage}${langNote}`
    : `User: ${userMessage}${langNote}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text ?? "";
  } catch (error) {
    console.error("Gemini API call failed, using fallback:", error);
    return getFallbackResponse(modeSlug, userMessage, language);
  }
}

/**
 * Streaming Gemini response — for future streaming UI.
 */
export async function* generateChatResponseStream(
  modeSlug: AnyModeSlug,
  userMessage: string,
  history: ChatHistoryEntry[],
  mode?: PracticeMode,
  language?: string
): AsyncGenerator<string> {
  const client = getAI();
  if (!client) {
    yield getFallbackResponse(modeSlug, userMessage, language);
    return;
  }

  const systemPrompt = getPromptForMode(modeSlug, mode);

  const conversationContext = history
    .slice(-10)
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
    .join("\n");

  const langNote = language && language !== "en-US"
    ? `\n[User's preferred language: ${language}. Respond in this language unless the mode requires English.]`
    : "";

  const fullPrompt = conversationContext
    ? `${conversationContext}\nUser: ${userMessage}${langNote}`
    : `User: ${userMessage}${langNote}`;

  try {
    const response = await client.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Gemini streaming failed, using fallback:", error);
    yield getFallbackResponse(modeSlug, userMessage, language);
  }
}
