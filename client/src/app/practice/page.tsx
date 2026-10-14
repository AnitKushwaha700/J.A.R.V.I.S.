import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import {
  MessageCircle, Briefcase, UtensilsCrossed, Plane,
  Building2, GraduationCap, ShoppingBag, Swords,
  Code2, TrendingUp, BookOpenCheck, Languages, Sparkles, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { PRACTICE_MODES } from "@/constants/practice-modes"
import { AGENT_MODES } from "@/constants/agent-modes"
import React from "react"

const iconMap: Record<string, React.ElementType> = {
  MessageCircle,
  Briefcase,
  UtensilsCrossed,
  Plane,
  Building2,
  GraduationCap,
  ShoppingBag,
  Swords,
  Code2,
  TrendingUp,
  BookOpenCheck,
  Languages,
}

export default function PracticePage() {
  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-12">
      {/* ─── Hero Intro ────────────────────────────────────────────── */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Jarvis Command Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-gradient-jarvis">
          Choose Your AI Assistant Mode
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          From full DSA algorithmic interviews and career roadmaps, to real-life English conversation scenarios. All voice-ready.
        </p>
      </div>

      {/* ─── Agent Super Modes ─────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              🤖 Specialized AI Agent Modes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal intelligence agents with deep domain capabilities.
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            4 Modes
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENT_MODES.map((mode) => {
            const Icon = iconMap[mode.icon] || MessageCircle
            return (
              <Card
                key={mode.slug}
                className="glass-panel glass-card-hover border-white/10 flex flex-col h-full rounded-2xl group transition-all"
              >
                <CardHeader className="p-5 pb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mode.color} transition-transform duration-300 group-hover:scale-110 shadow-lg`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-indigo-400 transition-colors">
                    {mode.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1.5 leading-relaxed text-muted-foreground">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-5 pt-2">
                  <Link
                    href={`/voice?mode=${mode.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "w-full rounded-xl bg-white/5 border-white/10 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all text-xs font-semibold flex items-center justify-center gap-1.5",
                    })}
                  >
                    <span>Launch Mode</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ─── English Practice Scenarios ────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              🎓 English Fluency & Real-Life Scenarios
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Practice spoken English across everyday situations with instant grammar & pronunciation coaching.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {PRACTICE_MODES.length} Scenarios
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_MODES.map((mode) => {
            const Icon = iconMap[mode.icon] || MessageCircle
            return (
              <Card
                key={mode.slug}
                className="glass-panel glass-card-hover border-white/10 flex flex-col h-full rounded-2xl group transition-all"
              >
                <CardHeader className="p-5 pb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mode.color} transition-transform duration-300 group-hover:scale-110 shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-emerald-400 transition-colors">
                    {mode.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1.5 leading-relaxed text-muted-foreground">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-5 pt-2">
                  <Link
                    href={`/voice?mode=${mode.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "w-full rounded-xl bg-white/5 border-white/10 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white group-hover:border-transparent transition-all text-xs font-semibold flex items-center justify-center gap-1.5",
                    })}
                  >
                    <span>Start Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
