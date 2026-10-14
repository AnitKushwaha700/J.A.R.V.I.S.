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
    desc: "Speak naturally in English, Hindi, Tamil, Telugu, or 50+ languages. Zero latency conversational voice reply.",
    mode: "free-talk",
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
    title: "Mock HR Interview Prep",
    desc: "Simulate behavioral & technical job interviews. Get instant scoring on confidence, STAR structure, and vocabulary.",
    mode: "interview",
    badge: "Career Ready",
  },
  {
    icon: TrendingUp,
    color: "from-emerald-400 to-teal-500",
    glow: "rgba(16, 185, 129, 0.3)",
    title: "Career & Tech Advisor",
    desc: "Tailored software engineering roadmaps, Indian IT market salary insights, and step-by-step skill mastery.",
    mode: "career-advisor",
    badge: "Roadmaps",
  },
  {
    icon: BrainCircuit,
    color: "from-purple-500 to-pink-500",
    glow: "rgba(168, 85, 247, 0.3)",
    title: "AI English Fluency Coach",
    desc: "Real-time grammar corrections, CEFR proficiency level tracking (A1 to C2), and natural vocabulary upgrades.",
    mode: "free-talk",
    badge: "Grammar & CEFR",
  },
  {
    icon: BookOpenCheck,
    color: "from-violet-500 to-indigo-500",
    glow: "rgba(139, 92, 246, 0.3)",
    title: "AI Teacher (Any Subject)",
    desc: "Learn Math, Physics, Computer Science, or History from first principles with interactive quizzes and examples.",
    mode: "ai-teacher",
    badge: "Concept Mastery",
  },
  {
    icon: Languages,
    color: "from-amber-400 to-orange-500",
    glow: "rgba(245, 158, 11, 0.3)",
    title: "Live Voice Translator",
    desc: "Translate spoken voice between any languages instantly with phonetic cadence and cultural phrasing.",
    mode: "translator",
    badge: "50+ Languages",
  },
  {
    icon: LineChart,
    color: "from-rose-400 to-pink-500",
    glow: "rgba(244, 63, 94, 0.3)",
    title: "Learning Analytics & XP",
    desc: "Daily streaks, grammar mistake log, vocabulary vault, speaking minutes tracker, and XP progression.",
    mode: "dashboard",
    badge: "Track Growth",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-16 lg:space-y-24">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center pt-8 pb-12 sm:pt-14 sm:pb-16 px-2">
        {/* Glowing Badge */}
        <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.25)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          <span>100% Free Personal AI Agent · Like Jarvis in Your Browser</span>
          <Zap className="w-3.5 h-3.5 ml-2 text-indigo-400" />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl mb-6 font-heading leading-[1.1]">
          Your Personal <span className="text-gradient-cyan">Jarvis AI</span>
          <br />
          <span className="text-gradient-jarvis">Talk, Code, Learn & Master</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Speak in any language with zero delay voice. Solve DSA coding problems, prepare for tech interviews,
          get career roadmaps, or master fluent English — all 100% free with no login required.
        </p>

        {/* Trust Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground/80 mb-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Voice-First AI</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>50+ Languages</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Laptop + Mobile PWA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Free Forever · ₹0</span>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/voice?mode=free-talk"
            className={buttonVariants({
              size: "lg",
              className:
                "w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all group",
            })}
          >
            <Mic className="mr-2 w-5 h-5 animate-pulse" />
            Start Talking to Jarvis
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/practice"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className:
                "w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-full border-border/80 bg-background/60 backdrop-blur-md hover:bg-white/10 transition-all",
            })}
          >
            Explore All 8 Modes
          </Link>
        </div>

        {/* Interactive Preview Mockup Card */}
        <div className="mt-14 w-full max-w-4xl p-1 rounded-2xl bg-gradient-to-b from-indigo-500/30 via-border/40 to-transparent shadow-2xl">
          <div className="glass-panel rounded-2xl p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">jarvis-agent-v2.0 // live session</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                Active State: Listening
              </span>
            </div>

            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-md">
                  &ldquo;Jarvis, help me prepare for a Google frontend interview and explain two-sum in TypeScript.&rdquo;
                </div>
              </div>
              <div className="flex justify-start">
                <div className="glass-panel text-card-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm border-white/10 space-y-2">
                  <p className="leading-relaxed">
                    Hello! I&apos;m ready. Here is the optimal TypeScript approach using a Hash Map in <span className="text-emerald-400 font-semibold">O(N) time</span>:
                  </p>
                  <div className="bg-[#0b0c16] p-2.5 rounded-lg font-mono text-xs text-indigo-200 border border-white/10">
                    <span className="text-purple-400">function</span> <span className="text-cyan-400">twoSum</span>(nums: <span className="text-amber-400">number[]</span>, target: <span className="text-amber-400">number</span>): <span className="text-amber-400">number[]</span> &#123; ... &#125;
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>CEFR Confidence: 94% · Grammar: Flawless</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8 Agent Features Grid ─────────────────────────────────── */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-heading mb-3 text-gradient-jarvis">
              Everything Your Personal Jarvis Can Do
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base">
              One unified platform. 8 specialized AI super-modes. Instant voice response in any language.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {agentFeatures.map((f) => (
              <Link
                key={f.title}
                href={f.mode === "dashboard" ? "/dashboard" : `/voice?mode=${f.mode}`}
                className="group block"
              >
                <Card className="glass-panel glass-card-hover border-white/10 h-full flex flex-col p-2 rounded-2xl transition-all">
                  <CardHeader className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${f.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                        style={{ boxShadow: `0 8px 20px -4px ${f.glow}` }}
                      >
                        <f.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-colors">
                        {f.badge}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                      {f.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-2 text-muted-foreground/90 leading-relaxed">
                      {f.desc}
                    </CardDescription>
                  </CardHeader>
                  <div className="px-4 pb-4 pt-1 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Launch Mode</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Highlights ─────────────────────────────────── */}
      <section className="py-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left relative z-10">
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Google Gemini 2.0 Flash</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Supercharged by Google&apos;s latest multimodal reasoning model with ultra-fast generation and zero cost.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Immediate Voice Streaming</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Web Speech API integration with sentence-level text-to-speech for seamless conversation with barge-in support.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Mobile & Laptop PWA</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add directly to your Android or iOS home screen as a standalone app. Practice on the go anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Section ─────────────────────────────────────── */}
      <section className="py-12 text-center relative">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading text-gradient-jarvis">
            Meet Your Personal Jarvis Today
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            No signup. No credit card. Zero setup hassle. Just tap the mic and start talking.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link
              href="/voice?mode=free-talk"
              className={buttonVariants({
                size: "lg",
                className:
                  "h-14 px-10 text-base font-bold rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all",
              })}
            >
              <Mic className="w-5 h-5 mr-2" /> Start Free Voice Chat
            </Link>
            <Link
              href="/voice?mode=coding-tutor"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-14 px-8 text-base font-semibold rounded-full border-white/20 hover:bg-white/10 transition-all",
              })}
            >
              <Code2 className="w-5 h-5 mr-2 text-cyan-400" /> Coding Tutor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}