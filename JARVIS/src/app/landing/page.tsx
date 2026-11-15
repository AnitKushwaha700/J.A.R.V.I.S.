import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic,
  Sparkles,
  BrainCircuit,
  LineChart,
  ArrowRight,
  Code2,
  TrendingUp,
  BookOpenCheck,
  Languages,
  Briefcase,
  Zap,
  ShieldCheck,
  Smartphone,
  Cpu,
} from "lucide-react";
import Link from "next/link";

const agentFeatures = [
  {
    icon: Mic,
    color: "from-indigo-500 to-cyan-400",
    glow: "rgba(99, 102, 241, 0.3)",
    title: "Instant Voice Assistant",
    desc: "Speak naturally in English with Grok 4.7. Zero latency conversational voice reply.",
    mode: "assistant",
    badge: "Voice-First",
  },
  {
    icon: Code2,
    color: "from-cyan-400 to-blue-500",
    glow: "rgba(6, 182, 212, 0.3)",
    title: "Coding & DSA Tutor",
    desc: "Solve algorithmic problems, debug code, and analyze time & space complexities with VS Code-style blocks.",
    mode: "coding-tutor",
    badge: "Algorithms",
  },
  {
    icon: Briefcase,
    color: "from-blue-500 to-indigo-600",
    glow: "rgba(59, 130, 246, 0.3)",
    title: "Mock HR & Tech Interview Prep",
    desc: "Simulate behavioral & technical job interviews. Get instant scoring on confidence, STAR structure, and vocabulary.",
    mode: "interview",
    badge: "Career Ready",
  },
  {
    icon: TrendingUp,
    color: "from-emerald-400 to-teal-500",
    glow: "rgba(16, 185, 129, 0.3)",
    title: "Career & Tech Advisor",
    desc: "Tailored software engineering roadmaps, IT market salary insights, and step-by-step skill mastery.",
    mode: "career-advisor",
    badge: "Roadmaps",
  },
  {
    icon: BrainCircuit,
    color: "from-purple-500 to-pink-500",
    glow: "rgba(168, 85, 247, 0.3)",
    title: "AI English Fluency Coach",
    desc: "Real-time grammar corrections, CEFR proficiency level tracking (A1 to C2), and natural vocabulary upgrades.",
    mode: "english",
    badge: "Grammar & CEFR",
  },
  {
    icon: LineChart,
    color: "from-rose-400 to-pink-500",
    glow: "rgba(244, 63, 94, 0.3)",
    title: "Task Management & XP",
    desc: "Daily streaks, task checklist, priority tracker, speaking minutes tracker, and XP progression.",
    mode: "dashboard",
    badge: "Track Growth",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen px-4 py-12 max-w-7xl mx-auto space-y-16">
      <section className="relative flex flex-col items-center justify-center text-center pt-8 pb-12 sm:pt-14 sm:pb-16 px-2">
        <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300 mb-8 backdrop-blur-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5 mr-2 text-cyan-400" />
          <span>JARVIS Personal AI Agent · Powered by Grok 4.7</span>
          <Zap className="w-3.5 h-3.5 ml-2 text-cyan-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl mb-6 font-heading leading-[1.1]">
          Your Personal <span className="text-cyan-400">JARVIS AI</span>
          <br />
          <span>Talk, Code, Learn & Master</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Speak naturally with zero delay voice. Practice English, prepare for tech interviews,
          manage your daily tasks, and master software engineering with Grok by xAI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className:
                "w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all group",
            })}
          >
            <Zap className="mr-2 w-5 h-5" />
            Open JARVIS HUD Workspace
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <Card key={feat.title} className="bg-card/40 border-border/60 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feat.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                    {feat.badge}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold">{feat.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{feat.desc}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
