"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Star,
  Volume2,
  TrendingUp,
  BookOpen,
  Languages,
  Code2,
  Map,
  Target,
} from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import type { AIResponse } from "@/types";

interface AgentFeedbackPanelProps {
  response: AIResponse | null;
  isVisible: boolean;
  mode?: string; // mode slug to show right panel
}

// ─── English Coach Panel ────────────────────────────────────────────
function EnglishCoachPanel({ response }: { response: AIResponse }) {
  const hasContent =
    response.grammarFixes.length > 0 ||
    response.betterWords.length > 0 ||
    response.pronunciationTip ||
    response.encouragement;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Confidence + CEFR */}
      <div className="flex items-center gap-3 flex-wrap">
        {response.confidenceScore > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="stroke-muted fill-none"
                  strokeWidth="3"
                  r="15.9"
                  cx="18"
                  cy="18"
                />
                <circle
                  className="fill-none stroke-indigo-500 transition-all duration-700"
                  strokeWidth="3"
                  strokeDasharray={`${response.confidenceScore} 100`}
                  strokeLinecap="round"
                  r="15.9"
                  cx="18"
                  cy="18"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {response.confidenceScore}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Confidence</span>
          </div>
        )}
        {response.cefrLevel && (
          <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            {response.cefrLevel}
          </span>
        )}
        {response.encouragement && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Star className="w-3 h-3" />
            {response.encouragement}
          </p>
        )}
      </div>

      {/* Grammar Fixes */}
      {response.grammarFixes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Grammar Corrections
          </h4>
          {response.grammarFixes.map((fix, i) => (
            <div
              key={i}
              className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/30 p-3 text-xs"
            >
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-rose-500 font-mono line-through whitespace-nowrap">
                  {fix.wrong}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  {fix.right}
                </span>
              </div>
              <p className="text-muted-foreground">{fix.why}</p>
            </div>
          ))}
        </div>
      )}

      {/* Better Words */}
      {response.betterWords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Better Vocabulary
          </h4>
          {response.betterWords.map((word, i) => (
            <div
              key={i}
              className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-3 text-xs"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-muted-foreground line-through">
                  {word.youSaid}
                </span>
                <span>→</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {word.better}
                </span>
              </div>
              <p className="text-muted-foreground italic">&ldquo;{word.example}&rdquo;</p>
            </div>
          ))}
        </div>
      )}

      {/* Pronunciation Tip */}
      {response.pronunciationTip && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 p-3 text-xs flex gap-2">
          <Volume2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-blue-700 dark:text-blue-300">
            {response.pronunciationTip}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Coding Tutor Panel ──────────────────────────────────────────────
function CodingPanel({ response }: { response: AIResponse }) {
  return (
    <div className="space-y-3">
      {response.displayText && (
        <div className="rounded-lg bg-muted/30 p-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {response.displayText}
        </div>
      )}
      {response.code && (
        <CodeBlock
          code={response.code}
          timeComplexity={response.timeComplexity}
          spaceComplexity={response.spaceComplexity}
          keyInsight={response.keyInsight}
        />
      )}
      {response.followUp && (
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 p-3 text-xs flex gap-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-indigo-700 dark:text-indigo-300">
            {response.followUp}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Career Advisor Panel ─────────────────────────────────────────────
function CareerPanel({ response }: { response: AIResponse }) {
  return (
    <div className="space-y-3">
      {response.displayText && (
        <div className="rounded-lg bg-muted/30 p-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {response.displayText}
        </div>
      )}
      {response.roadmap && response.roadmap.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-emerald-500" />
            Your Roadmap
          </h4>
          {response.roadmap.map((step, i) => (
            <div
              key={i}
              className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 p-3 text-xs"
            >
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                {step.month}
              </p>
              <p className="text-foreground/80 mb-1">{step.focus}</p>
              {step.resources && (
                <p className="text-muted-foreground">📚 {step.resources}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {response.skills && response.skills.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-blue-500" />
            Key Skills to Learn
          </h4>
          <div className="flex flex-wrap gap-2">
            {response.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {response.careerTip && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 p-3 text-xs flex gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-700 dark:text-amber-300">
            {response.careerTip}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── AI Teacher Panel ─────────────────────────────────────────────────
function TeacherPanel({ response }: { response: AIResponse }) {
  return (
    <div className="space-y-3">
      {response.displayText && (
        <div className="rounded-lg bg-muted/30 p-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {response.displayText}
        </div>
      )}
      {response.keyPoints && response.keyPoints.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-violet-500" />
            Key Points
          </h4>
          {response.keyPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <p>{point}</p>
            </div>
          ))}
        </div>
      )}
      {response.example && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 p-3 text-xs">
          <p className="text-muted-foreground mb-1 font-semibold">Example:</p>
          <p className="text-violet-700 dark:text-violet-300">
            {response.example}
          </p>
        </div>
      )}
      {response.quiz && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 p-3 text-xs flex gap-2">
          <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              Quick Quiz:
            </p>
            <p>{response.quiz}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Translator Panel ─────────────────────────────────────────────────
function TranslatorPanel({ response }: { response: AIResponse }) {
  return (
    <div className="space-y-3">
      {response.translated && (
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 p-4">
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Languages className="w-3.5 h-3.5 text-amber-500" />
            <span>{response.fromLanguage}</span>
            <span>→</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {response.toLanguage}
            </span>
          </div>
          {response.original && (
            <p className="text-xs text-muted-foreground mb-2 line-through">
              {response.original}
            </p>
          )}
          <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            {response.translated}
          </p>
          {response.phonetic && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              🔊 {response.phonetic}
            </p>
          )}
          {response.culturalNote && (
            <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-2 border-t border-amber-200/50 pt-2">
              📌 {response.culturalNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function AgentFeedbackPanel({
  response,
  isVisible,
  mode,
}: AgentFeedbackPanelProps) {
  const isAgentMode = mode && ["coding-tutor", "career-advisor", "ai-teacher", "translator"].includes(mode);
  const hasEnglishContent =
    response &&
    (response.grammarFixes.length > 0 ||
      response.betterWords.length > 0 ||
      response.pronunciationTip ||
      response.encouragement);
  const hasAgentContent =
    response &&
    (response.displayText ||
      response.code ||
      response.roadmap?.length ||
      response.keyPoints?.length ||
      response.translated);

  const shouldShow = isVisible && response && (isAgentMode ? hasAgentContent : hasEnglishContent);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="border-t border-border/40 bg-background/95 overflow-hidden"
        >
          <div className="px-4 py-4 max-h-72 overflow-y-auto">
            {mode === "coding-tutor" && <CodingPanel response={response!} />}
            {mode === "career-advisor" && <CareerPanel response={response!} />}
            {mode === "ai-teacher" && <TeacherPanel response={response!} />}
            {mode === "translator" && <TranslatorPanel response={response!} />}
            {(!mode || !isAgentMode) && <EnglishCoachPanel response={response!} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
