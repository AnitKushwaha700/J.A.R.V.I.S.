"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { VoiceState } from "@/types";
import { Mic, MicOff, Loader2, Volume2, Sparkles } from "lucide-react";

interface VoiceOrbProps {
  state: VoiceState;
  onClick: () => void;
  silenceProgress?: number; // 0-1, how close to silence threshold
}

const stateConfig: Record<
  VoiceState,
  {
    label: string;
    sublabel: string;
    gradient: string;
    glowColor: string;
    ringColor: string;
    icon: React.ElementType;
  }
> = {
  idle: {
    label: "Tap to Speak",
    sublabel: "Jarvis is ready in any language",
    gradient: "from-indigo-600 via-purple-600 to-indigo-800",
    glowColor: "rgba(99, 102, 241, 0.4)",
    ringColor: "border-indigo-500/30",
    icon: Mic,
  },
  listening: {
    label: "Listening to You...",
    sublabel: "Speak naturally · Auto silence detection",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    glowColor: "rgba(16, 185, 129, 0.5)",
    ringColor: "border-emerald-500/40",
    icon: Mic,
  },
  processing: {
    label: "Thinking...",
    sublabel: "Reasoning with Gemini 2.0 Flash",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    glowColor: "rgba(245, 158, 11, 0.5)",
    ringColor: "border-amber-500/40",
    icon: Loader2,
  },
  speaking: {
    label: "Jarvis Speaking...",
    sublabel: "Tap to interrupt (barge-in enabled)",
    gradient: "from-cyan-500 via-blue-600 to-indigo-600",
    glowColor: "rgba(6, 182, 212, 0.5)",
    ringColor: "border-cyan-500/40",
    icon: Volume2,
  },
  error: {
    label: "Mic Error",
    sublabel: "Tap to retry speech permission",
    gradient: "from-rose-500 via-red-600 to-pink-600",
    glowColor: "rgba(244, 63, 94, 0.5)",
    ringColor: "border-rose-500/40",
    icon: MicOff,
  },
};

export function VoiceOrb({
  state,
  onClick,
  silenceProgress = 0,
}: VoiceOrbProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";

  return (
    <div className="flex flex-col items-center gap-5 my-2">
      <div className="relative flex items-center justify-center">
        {/* Concentric ambient pulse waves */}
        <AnimatePresence>
          {(isListening || isSpeaking) && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute w-28 h-28 rounded-full pointer-events-none"
                style={{ backgroundColor: config.glowColor }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.8,
                }}
                className="absolute w-28 h-28 rounded-full pointer-events-none"
                style={{ backgroundColor: config.glowColor }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Outer Tech Ring with Rotating Dashes */}
        <motion.div
          animate={{
            rotate: isProcessing ? 360 : isListening ? [0, 360] : 0,
          }}
          transition={{
            duration: isProcessing ? 3 : 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute w-36 h-36 rounded-full border border-dashed ${config.ringColor} pointer-events-none`}
        />

        {/* Silence auto-cutoff SVG ring */}
        {isListening && silenceProgress > 0 && (
          <svg
            className="absolute w-32 h-32 -rotate-90 origin-center pointer-events-none z-20"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(245, 158, 11, 0.9)"
              strokeWidth="4"
              strokeDasharray={`${silenceProgress * 289} 289`}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
        )}

        {/* Main Jarvis Orb Button */}
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr ${config.gradient} flex items-center justify-center cursor-pointer transition-all duration-500 focus:outline-none shadow-2xl`}
          style={{
            boxShadow: `0 0 50px -10px ${config.glowColor}, 0 0 20px 2px ${config.glowColor} inset`,
          }}
          aria-label={config.label}
        >
          {/* Glass sphere top highlight / reflection */}
          <div className="absolute top-1 inset-x-3 h-10 bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none blur-[1px]" />

          {/* Inner core pulse animation */}
          <motion.div
            animate={
              isProcessing
                ? { rotate: 360 }
                : isSpeaking
                ? { scale: [1, 1.15, 1] }
                : isListening
                ? { scale: [1, 1.08, 1] }
                : {}
            }
            transition={
              isProcessing
                ? { duration: 1.2, repeat: Infinity, ease: "linear" }
                : isSpeaking
                ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : isListening
                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            className="relative flex items-center justify-center"
          >
            <Icon className="w-11 h-11 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
          </motion.div>
        </motion.button>
      </div>

      {/* State label & sublabel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-center space-y-1"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-foreground">
            {isListening && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />}
            {isSpeaking && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />}
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-amber-400 inline-block" />}
            {state === "idle" && <Sparkles className="w-3 h-3 text-indigo-400 inline-block" />}
            <span>{config.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80">{config.sublabel}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
