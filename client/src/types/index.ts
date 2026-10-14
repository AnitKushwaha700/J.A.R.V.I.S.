// ─── AI Response Schema ───────────────────────────────────────────
export interface GrammarFix {
  wrong: string;
  right: string;
  why: string;
  severity: "low" | "medium" | "high";
}

export interface BetterWord {
  youSaid: string;
  better: string;
  example: string;
}

export interface CodeBlock {
  language: string;
  content: string;
}

export interface RoadmapStep {
  month: string;
  focus: string;
  resources: string;
}

export interface AIResponse {
  // ── Universal ──
  reply: string;
  displayText?: string;

  // ── English Coach ──
  grammarFixes: GrammarFix[];
  betterWords: BetterWord[];
  pronunciationTip: string;
  confidenceScore: number;
  cefrLevel: CEFRLevel;
  encouragement: string;

  // ── Coding Tutor ──
  code?: CodeBlock | null;
  timeComplexity?: string;
  spaceComplexity?: string;
  keyInsight?: string;
  followUp?: string;

  // ── Career Advisor ──
  roadmap?: RoadmapStep[];
  skills?: string[];
  careerTip?: string;

  // ── AI Teacher ──
  subject?: string;
  keyPoints?: string[];
  example?: string;
  quiz?: string;
  nextTopic?: string;

  // ── Translator ──
  original?: string;
  translated?: string;
  fromLanguage?: string;
  toLanguage?: string;
  phonetic?: string;
  culturalNote?: string;
}

// ─── CEFR Levels ──────────────────────────────────────────────────
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// ─── Messages ─────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  analysis?: {
    grammarFixes: GrammarFix[];
    betterWords: BetterWord[];
    confidenceScore: number;
    cefrLevel: CEFRLevel;
    pronunciationTip?: string;
    encouragement?: string;
    // Agent extras
    code?: CodeBlock | null;
    timeComplexity?: string;
    spaceComplexity?: string;
    keyInsight?: string;
    roadmap?: RoadmapStep[];
    skills?: string[];
    careerTip?: string;
    subject?: string;
    keyPoints?: string[];
    quiz?: string;
    translated?: string;
    fromLanguage?: string;
    toLanguage?: string;
    displayText?: string;
  };
}

// ─── Practice Modes (English Coach) ───────────────────────────────
export type PracticeModeSlug =
  | "free-talk"
  | "interview"
  | "restaurant"
  | "airport"
  | "office"
  | "college"
  | "shopping"
  | "debate";

export interface PracticeMode {
  slug: PracticeModeSlug;
  title: string;
  description: string;
  aiPersona: string;
  openingPrompt: string;
  icon: string;
  color: string;
  gradient: string;
}

// ─── Agent Modes (Jarvis features) ────────────────────────────────
export type AgentModeSlug =
  | "coding-tutor"
  | "career-advisor"
  | "ai-teacher"
  | "translator";

export interface AgentMode {
  slug: AgentModeSlug;
  title: string;
  description: string;
  aiPersona: string;
  openingPrompt: string;
  icon: string;
  color: string;
  gradient: string;
  category: "agent";
}

// ─── Unified mode slug type ────────────────────────────────────────
export type AnyModeSlug = PracticeModeSlug | AgentModeSlug;

// ─── Voice ────────────────────────────────────────────────────────
export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

// ─── Session ──────────────────────────────────────────────────────
export interface UserSession {
  sessionId: string;
  level: CEFRLevel;
  streak: number;
  totalMinutes: number;
  xp: number;
  lastActiveAt: Date;
  createdAt: Date;
}

// ─── Progress ─────────────────────────────────────────────────────
export interface DailyProgress {
  date: string;
  minutes: number;
  messages: number;
  grammarScore: number;
  newWords: number;
  streakMaintained: boolean;
}

// ─── Conversation ─────────────────────────────────────────────────
export interface ConversationSummary {
  id: string;
  mode: AnyModeSlug;
  startedAt: Date;
  duration: number;
  messageCount: number;
  avgConfidence: number;
}

// ─── API Types ────────────────────────────────────────────────────
export interface ChatRequest {
  message: string;
  mode: AnyModeSlug;
  conversationId?: string;
  history: Array<{ role: "user" | "ai"; text: string }>;
  language?: string;
}

export interface StreamChunk {
  type: "text" | "analysis" | "error" | "done";
  content: string;
}
