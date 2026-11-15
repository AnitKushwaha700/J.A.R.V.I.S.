import type { AgentMode } from "@/types";

export const AGENT_MODES: AgentMode[] = [
  {
    slug: "coding-tutor",
    title: "Coding Tutor",
    description: "Solve DSA problems, debug code, learn concepts. Any language.",
    aiPersona: "Senior Software Engineer & DSA Expert",
    openingPrompt:
      "Hey! I'm your coding buddy. Ask me any DSA problem, code concept, or debugging question. What are you working on today?",
    icon: "Code2",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    gradient: "from-cyan-500 to-blue-600",
    category: "agent",
  },
  {
    slug: "career-advisor",
    title: "Career Advisor",
    description: "Resume tips, career roadmaps, skill gaps, Indian job market advice.",
    aiPersona: "Senior Tech Career Mentor with 10+ years experience",
    openingPrompt:
      "Hello! I'm here to guide your career journey. Tell me about your background — what year are you in, what's your field, and what's your goal?",
    icon: "TrendingUp",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    gradient: "from-green-500 to-emerald-600",
    category: "agent",
  },
  {
    slug: "ai-teacher",
    title: "AI Teacher",
    description: "Learn any subject — Math, Science, History, Physics, Chemistry.",
    aiPersona: "Patient and friendly Professor who makes complex topics simple",
    openingPrompt:
      "Welcome to your personal classroom! I can teach you any subject. What topic would you like to learn today — Math, Science, History, or anything else?",
    icon: "BookOpenCheck",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    gradient: "from-violet-500 to-purple-600",
    category: "agent",
  },
  {
    slug: "translator",
    title: "Translator",
    description: "Translate between any languages instantly with voice.",
    aiPersona: "Professional Interpreter and Language Expert",
    openingPrompt:
      "Hello! Tell me what languages you want to translate between, or just start speaking and I'll help. E.g., 'Translate English to Hindi' or 'Hindi to English'.",
    icon: "Languages",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-500",
    category: "agent",
  },
];

export function getAgentModeBySlug(slug: string): AgentMode | undefined {
  return AGENT_MODES.find((m) => m.slug === slug);
}
