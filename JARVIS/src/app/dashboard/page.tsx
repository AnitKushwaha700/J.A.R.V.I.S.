"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, Target, Brain, AlertCircle, Sparkles, Mic, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalMinutes?: number;
    totalConversations?: number;
    totalMessages?: number;
    avgConfidence?: number;
    streak?: number;
    level?: string;
    recentMistakes?: Array<{
      id: string;
      wrong: string;
      right: string;
      why: string;
      occurrences: number;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load progress:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Syncing Jarvis Telemetry & Progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learning Intelligence & Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-gradient-jarvis">
            Your Progress Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time telemetry on speaking confidence, vocabulary growth, and daily practice streaks.
          </p>
        </div>

        <Link
          href="/voice?mode=free-talk"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all self-start sm:self-auto"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Start Daily Voice Practice</span>
        </Link>
      </div>

      {/* ─── Metric Stat Cards ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel glass-card-hover border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Speaking Time
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-heading text-foreground">
              {Math.round(data?.totalMinutes || 0)} <span className="text-base font-normal text-muted-foreground">min</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total voice conversation duration</p>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-card-hover border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Messages
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-heading text-foreground">
              {data?.totalMessages || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Across {data?.totalConversations || 0} sessions</p>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-card-hover border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fluency Score
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-heading text-emerald-400">
              {data?.avgConfidence || 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">CEFR Evaluated: Level {data?.level || "B1"}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-card-hover border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Streak
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-heading text-amber-400 flex items-center gap-1.5">
              <span>{data?.streak || 0}</span>
              <span className="text-base font-normal text-muted-foreground">Days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Consistency compounds fluency</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Main Breakdown Grids ─────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Grammar Fixes */}
        <Card className="md:col-span-4 glass-panel border-white/10 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading">Grammar Vault & Corrections</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time errors caught and corrected during your sessions.
                </CardDescription>
              </div>
              <Link href="/grammar" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentMistakes && data.recentMistakes.length > 0 ? (
                data.recentMistakes.map((mistake) => (
                  <div
                    key={mistake.id}
                    className="flex flex-col space-y-1.5 bg-white/5 border border-white/10 p-3.5 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="line-through text-rose-300/80 font-medium">{mistake.wrong}</span>
                      <span className="text-white/40">→</span>
                      <span className="font-bold text-emerald-400">{mistake.right}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                      {mistake.why}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground italic border border-dashed border-white/10 rounded-xl">
                  No mistakes recorded yet. Speak with Jarvis to analyze grammar!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Dial */}
        <Card className="md:col-span-3 glass-panel border-white/10 rounded-2xl flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold font-heading">Daily Voice Goal</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Recommended target: 30 speaking minutes per day
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${Math.min(((data?.totalMinutes || 0) / 30) * 440, 440)} 440`}
                  strokeLinecap="round"
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold font-heading text-foreground">
                  {Math.round(data?.totalMinutes || 0)}
                </span>
                <span className="text-xs text-muted-foreground">/ 30 min target</span>
              </div>
            </div>

            <Link
              href="/voice?mode=free-talk"
              className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Continue Daily Practice</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
