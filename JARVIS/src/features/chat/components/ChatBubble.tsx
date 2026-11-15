"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "@/types";
import { CheckCircle2, XCircle, Lightbulb, TrendingUp, Sparkles, User, Bot } from "lucide-react";

interface ChatBubbleProps {
  message: ChatMessage;
  showFeedback?: boolean;
}

export function ChatBubble({
  message,
  showFeedback = true,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const analysis = message.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} group`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-md ${
          isUser
            ? "bg-gradient-to-tr from-purple-500 to-indigo-600"
            : "bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all ${
            isUser
              ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20 shadow-md"
              : "glass-panel text-card-foreground border-white/10 rounded-tl-sm shadow-black/40 shadow-lg"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Feedback section — only for AI messages with analysis */}
        {!isUser && analysis && showFeedback && (
          <div className="mt-2.5 space-y-2 w-full">
            {/* Grammar fixes */}
            {analysis.grammarFixes && analysis.grammarFixes.length > 0 &&
              analysis.grammarFixes.map((fix, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-2 text-xs bg-rose-500/10 text-rose-300 px-3 py-2 rounded-xl border border-rose-500/20 backdrop-blur-sm"
                >
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
                  <div>
                    <span className="line-through text-rose-400/80">{fix.wrong}</span>
                    <span className="text-white/60 mx-1">→</span>
                    <span className="font-semibold text-rose-200">{fix.right}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {fix.why}
                    </span>
                  </div>
                </motion.div>
              ))}

            {/* Better words */}
            {analysis.betterWords && analysis.betterWords.length > 0 &&
              analysis.betterWords.map((word, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-2 text-xs bg-amber-500/10 text-amber-300 px-3 py-2 rounded-xl border border-amber-500/20 backdrop-blur-sm"
                >
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <span className="text-amber-400/80">&ldquo;{word.youSaid}&rdquo;</span>
                    <span className="text-white/60 mx-1">→</span>
                    <span className="font-semibold text-amber-200">&ldquo;{word.better}&rdquo;</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {word.example}
                    </span>
                  </div>
                </motion.div>
              ))}

            {/* Confidence & Encouragement */}
            {(analysis.confidenceScore > 0 || analysis.encouragement) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-2 text-xs bg-emerald-500/10 text-emerald-300 px-3 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-sm"
              >
                {analysis.confidenceScore > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                )}
                <div className="flex-1">
                  {analysis.confidenceScore > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-200">
                        {analysis.confidenceScore}% Fluency Score
                      </span>
                      {analysis.cefrLevel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 font-mono text-emerald-300 font-bold">
                          CEFR {analysis.cefrLevel}
                        </span>
                      )}
                    </div>
                  )}
                  {analysis.encouragement && (
                    <span className="block text-[11px] text-emerald-200/90 mt-0.5">
                      {analysis.encouragement}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground/60 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
