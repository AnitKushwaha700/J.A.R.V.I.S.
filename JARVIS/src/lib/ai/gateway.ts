import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import {
  type AnyModeSlug,
  type AssistantPersonality,
  type ResponseLength,
  type AIResponse,
} from "@/types";
import { parseAIResponse } from "@/features/coach/parsers/streamParser";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const personalityNotes: Record<AssistantPersonality, string> = {
  professional: "Maintain a calm, articulate, and authoritative software engineering mentor tone.",
  friendly: "Be warm, approachable, encouraging, and conversational.",
  strict: "Be exacting, direct, and uncompromising on technical depth while remaining respectful.",
  concise: "Keep spoken answers extremely sharp, direct, and actionable in 1-2 sentences.",
};

const lengthInstructions: Record<ResponseLength, string> = {
  short: "Keep the spoken 'reply' strictly 1 to 2 sentences for rapid voice turnaround.",
  balanced: "Keep the spoken 'reply' focused in 2 to 3 sentences, leaving deep explanations for displayText.",
  detailed: "Provide comprehensive depth in displayText while keeping spoken 'reply' conversational under 4 sentences.",
};

function buildMasterSystemPrompt(options?: {
  modeSlug?: AnyModeSlug;
  personality?: AssistantPersonality;
  responseLength?: ResponseLength;
  userContext?: string;
}): string {
  const personality = options?.personality || "professional";
  const length = options?.responseLength || "balanced";
  const personaNote = personalityNotes[personality] || personalityNotes.professional;
  const lengthNote = lengthInstructions[length] || lengthInstructions.balanced;

  return `You are JARVIS (TalkMe), an autonomous, production-grade multimodal AI voice assistant, English coach, interview mentor, and software engineering agent.

CORE PERSONA & VOICE:
- Tone: ${personaNote}
- Spoken Pacing: ${lengthNote}
- You speak directly to the user through high-fidelity speech synthesis. The "reply" field will be read aloud; keep it natural, crisp, conversational, and avoid reading raw markdown or symbols aloud.
- The "displayText" field is shown in the cyber HUD UI and can contain rich GitHub Flavored Markdown, code blocks, tables, and bullet points.

CAPABILITIES:
1. General Chat & Reasoning: Like ChatGPT/DeepSeek, you provide rigorous answers, code, problem-solving, and explanations.
2. English Speaking Coach: Identify major grammar errors and provide a natural workplace alternative and follow-up question.
3. Mock Interviewer: Conduct technical and behavioral interviews using the STAR method (Situation, Task, Action, Result) with scorecards.
4. Autonomous Developer: Write clean, production-ready, type-safe code with algorithmic complexity ($O(n)$, $O(\\log n)$).
5. Task Planner: When the user asks to plan tasks, schedule, or remind them, extract structured tasks into the "suggestedTasks" array.

${options?.userContext ? `PERSISTENT USER MEMORY CONTEXT:\n${options.userContext}\n` : ""}

CRITICAL OUTPUT FORMAT:
You MUST respond with valid JSON matching this schema:
{
  "reply": "string (the natural sentence to speak aloud)",
  "displayText": "string (the markdown formatted rich visual response)",
  "suggestedFollowUp": "string (a smart follow-up question or next step)",
  "grammarCorrection": {
    "original": "string",
    "corrected": "string",
    "explanation": "string",
    "professionalAlternative": "string"
  } | null,
  "suggestedTasks": [
    {
      "title": "string",
      "priority": "low" | "medium" | "high",
      "dueAt": "ISO date string or null"
    }
  ] | null,
  "starEvaluation": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string",
    "score": 1-100,
    "feedback": "string"
  } | null
}
`;
}

/**
 * Execute query using Groq Cloud (Llama 3.3 70B Versatile)
 */
async function queryGroq(
  systemPrompt: string,
  userMessage: string,
  history: ChatTurn[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");
  return content;
}

/**
 * Execute query using Google Gemini API (Gemini 2.0 / 1.5 Flash)
 */
async function queryGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatTurn[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const conversationHistory = history.slice(-6).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nUSER MESSAGE:\n${userMessage}\n\nRespond ONLY with the JSON object.`;

  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = typeof response.text === "string" ? response.text : (response as { text?: () => string }).text?.() || "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

/**
 * Smart Multi-Provider AI Gateway with Automatic Fallback Chain:
 * 1. Groq (Llama 3.3 70B) -> 0.2s ultra-fast voice
 * 2. Google Gemini (2.0 / 1.5 Flash) -> large context & deep reasoning
 * 3. Graceful standby message if keys are unconfigured
 */
export async function queryAIGateway(options: {
  message: string;
  history?: ChatTurn[];
  modeSlug?: AnyModeSlug;
  personality?: AssistantPersonality;
  responseLength?: ResponseLength;
  userContext?: string;
  preferredProvider?: "groq" | "gemini";
}): Promise<AIResponse & { provider: string; model: string }> {
  const history = options.history || [];
  const systemPrompt = buildMasterSystemPrompt(options);

  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  // If no AI keys configured, return instant offline HUD response
  if (!hasGroq && !hasGemini) {
    return {
      reply: "Welcome to JARVIS. To enable my neural intelligence, please add your free Groq API key or Gemini API key to .env.local.",
      displayText: "### ⚡ JARVIS Core Ready\n\nTo activate real-time AI reasoning, speech, and tool capabilities:\n\n1. Get a **Free Groq API Key** from [console.groq.com/keys](https://console.groq.com/keys)\n2. Or get a **Free Gemini API Key** from [aistudio.google.com](https://aistudio.google.com/apikey)\n3. Add `GROQ_API_KEY=gsk_...` to your `.env.local` file.",
      followUp: "Would you like me to walk you through getting a free Groq API key?",
      grammarFixes: [],
      betterWords: [],
      pronunciationTip: "",
      confidenceScore: 100,
      cefrLevel: "C2",
      encouragement: "Systems are fully operational.",
      provider: "offline-standby",
      model: "system-ready",
    };
  }

  // Provider execution order
  const providers = options.preferredProvider === "gemini" 
    ? ["gemini", "groq"] 
    : ["groq", "gemini"];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      if (provider === "groq" && hasGroq) {
        const rawJson = await queryGroq(systemPrompt, options.message, history);
        const parsed = parseAIResponse(rawJson);
        return {
          ...parsed,
          provider: "groq",
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        };
      }

      if (provider === "gemini" && hasGemini) {
        const rawJson = await queryGemini(systemPrompt, options.message, history);
        const parsed = parseAIResponse(rawJson);
        return {
          ...parsed,
          provider: "gemini",
          model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI Gateway] ${provider} failed, trying fallback:`, lastError.message);
    }
  }

  // If all attempted providers failed
  throw lastError || new Error("All configured AI providers failed to respond.");
}
