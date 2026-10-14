import type { AIResponse } from "@/types";

/**
 * Strips markdown code fences from AI output.
 */
function stripFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Parses any AI response JSON into a structured AIResponse.
 * Works for all modes: English coach, coding tutor, career advisor, teacher, translator.
 * Falls back gracefully if JSON is malformed.
 */
export function parseAIResponse(raw: string): AIResponse {
  const defaultResponse: AIResponse = {
    reply: "",
    grammarFixes: [],
    betterWords: [],
    pronunciationTip: "",
    confidenceScore: 50,
    cefrLevel: "B1",
    encouragement: "",
  };

  try {
    const cleaned = stripFences(raw);
    const parsed = JSON.parse(cleaned);

    return {
      // ── Universal ──
      reply: String(parsed.reply || ""),
      displayText: parsed.displayText ? String(parsed.displayText) : undefined,

      // ── English Coach ──
      grammarFixes: Array.isArray(parsed.grammarFixes)
        ? parsed.grammarFixes.map((fix: Record<string, unknown>) => ({
            wrong: String(fix.wrong || ""),
            right: String(fix.right || ""),
            why: String(fix.why || ""),
            severity:
              fix.severity === "low" || fix.severity === "high"
                ? fix.severity
                : "medium",
          }))
        : [],
      betterWords: Array.isArray(parsed.betterWords)
        ? parsed.betterWords.map((word: Record<string, unknown>) => ({
            youSaid: String(word.youSaid || ""),
            better: String(word.better || ""),
            example: String(word.example || ""),
          }))
        : [],
      pronunciationTip: String(parsed.pronunciationTip || ""),
      confidenceScore:
        typeof parsed.confidenceScore === "number"
          ? Math.min(100, Math.max(0, parsed.confidenceScore))
          : 50,
      cefrLevel: parsed.cefrLevel || "B1",
      encouragement: String(parsed.encouragement || ""),

      // ── Coding Tutor ──
      code:
        parsed.code && typeof parsed.code === "object"
          ? {
              language: String(parsed.code.language || "python"),
              content: String(parsed.code.content || ""),
            }
          : null,
      timeComplexity: parsed.timeComplexity
        ? String(parsed.timeComplexity)
        : undefined,
      spaceComplexity: parsed.spaceComplexity
        ? String(parsed.spaceComplexity)
        : undefined,
      keyInsight: parsed.keyInsight ? String(parsed.keyInsight) : undefined,
      followUp: parsed.followUp ? String(parsed.followUp) : undefined,

      // ── Career Advisor ──
      roadmap: Array.isArray(parsed.roadmap)
        ? parsed.roadmap.map((step: Record<string, unknown>) => ({
            month: String(step.month || ""),
            focus: String(step.focus || ""),
            resources: String(step.resources || ""),
          }))
        : undefined,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map(String)
        : undefined,
      careerTip: parsed.careerTip ? String(parsed.careerTip) : undefined,

      // ── AI Teacher ──
      subject: parsed.subject ? String(parsed.subject) : undefined,
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map(String)
        : undefined,
      example: parsed.example ? String(parsed.example) : undefined,
      quiz: parsed.quiz ? String(parsed.quiz) : undefined,
      nextTopic: parsed.nextTopic ? String(parsed.nextTopic) : undefined,

      // ── Translator ──
      original: parsed.original ? String(parsed.original) : undefined,
      translated: parsed.translated ? String(parsed.translated) : undefined,
      fromLanguage: parsed.fromLanguage
        ? String(parsed.fromLanguage)
        : undefined,
      toLanguage: parsed.toLanguage ? String(parsed.toLanguage) : undefined,
      phonetic: parsed.phonetic ? String(parsed.phonetic) : undefined,
      culturalNote: parsed.culturalNote
        ? String(parsed.culturalNote)
        : undefined,
    };
  } catch {
    // If JSON parsing fails, treat raw text as the reply
    return {
      ...defaultResponse,
      reply:
        raw.trim() ||
        "I didn't quite catch that. Could you try again?",
    };
  }
}

/**
 * Splits text into sentences for sentence-by-sentence TTS.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g);
  return sentences ? sentences.map((s) => s.trim()).filter(Boolean) : [text];
}
