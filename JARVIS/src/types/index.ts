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

  // ── Interview Coach (STAR Method) ──
  starEvaluation?: {
    situation: string;
    task: string;
    action: string;
    result: string;
    score: number;
    strongerSampleAnswer?: string;
  };

  // ── Extracted Action / Tasks ──
  suggestedTasks?: Array<{
    title: string;
    priority: "low" | "medium" | "high";
    dueAt?: string;
  }>;
}

// ─── CEFR Levels ──────────────────────────────────────────────────
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// ─── Assistant Configuration & Personalities ──────────────────────
export type AssistantPersonality =
  | "professional"
  | "friendly"
  | "strict"
  | "concise";

export type ResponseLength = "short" | "balanced" | "detailed";

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
  | "assistant"
  | "english"
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

// ─── Tasks & Productivity ─────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "completed" | "skipped";
export type TaskPriority = "low" | "medium" | "high";

export interface WorkspaceTask {
  id: string;
  sessionId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Memory & Preferences ─────────────────────────────────────────
export type MemoryCategory =
  | "preference"
  | "career_goal"
  | "learning_fact"
  | "tech_skill"
  | "mistake_pattern";

export interface UserMemory {
  id: string;
  sessionId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Interviews ──────────────────────────────────────────────
export type InterviewRole =
  | "junior-software-engineer"
  | "backend-developer"
  | "full-stack-developer"
  | "java-developer"
  | "mern-stack-developer"
  | "nextjs-developer"
  | "qa-engineer";

export interface InterviewQuestionAttempt {
  id: string;
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  starBreakdown?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  missingConcepts?: string[];
  strongerSampleAnswer?: string;
  answeredAt: string;
}

export interface InterviewSessionSummary {
  id: string;
  sessionId: string;
  role: InterviewRole;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "in_progress" | "completed";
  questions: InterviewQuestionAttempt[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  preparationPlan?: string[];
  createdAt: string;
  updatedAt: string;
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
  personality?: AssistantPersonality;
  responseLength?: ResponseLength;
}

export interface StreamChunk {
  type: "text" | "analysis" | "error" | "done";
  content: string;
}
