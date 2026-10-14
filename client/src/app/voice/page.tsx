"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings2,
  Send,
  RotateCcw,
  Keyboard,
  Globe,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";

import { VoiceOrb } from "@/features/voice/components/VoiceOrb";
import { LiveTranscript } from "@/features/voice/components/LiveTranscript";
import { ChatBubble } from "@/features/chat/components/ChatBubble";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { AgentFeedbackPanel } from "@/features/chat/components/AgentFeedbackPanel";

import { useSpeechRecognition } from "@/features/voice/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/features/voice/hooks/useSpeechSynthesis";
import { useSilenceDetector } from "@/features/voice/hooks/useSilenceDetector";
import { useChatStream } from "@/features/chat/hooks/useChatStream";

import { getPracticeModeBySlug, PRACTICE_MODES } from "@/constants/practice-modes";
import { getAgentModeBySlug, AGENT_MODES } from "@/constants/agent-modes";
import type { AIResponse, AnyModeSlug, VoiceState } from "@/types";

// ─── Language Options ────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { code: "ta-IN", label: "Tamil", flag: "🇮🇳" },
  { code: "te-IN", label: "Telugu", flag: "🇮🇳" },
  { code: "bn-IN", label: "Bengali", flag: "🇮🇳" },
  { code: "mr-IN", label: "Marathi", flag: "🇮🇳" },
  { code: "gu-IN", label: "Gujarati", flag: "🇮🇳" },
  { code: "es-ES", label: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", label: "French", flag: "🇫🇷" },
  { code: "de-DE", label: "German", flag: "🇩🇪" },
  { code: "ja-JP", label: "Japanese", flag: "🇯🇵" },
  { code: "zh-CN", label: "Chinese", flag: "🇨🇳" },
  { code: "ar-SA", label: "Arabic", flag: "🇸🇦" },
];

const MODE_SUGGESTIONS: Record<string, string[]> = {
  "free-talk": [
    "Tell me an interesting science breakthrough",
    "Let's practice English conversational fluency for meetings",
    "How can I sound more confident and natural when speaking?",
  ],
  "interview": [
    "Ask me a Behavioral STAR interview question for software engineers",
    "What are common mistakes candidates make in tech HR rounds?",
    "Simulate an interview question: 'Tell me about a time you resolved a conflict.'",
  ],
  "coding-tutor": [
    "Explain Two Sum in TypeScript with optimal O(n) hash map",
    "How does Dijkstra's shortest path algorithm work?",
    "Explain the difference between Dynamic Programming and Greedy algorithms",
  ],
  "career-advisor": [
    "Give me a 6-month roadmap to become a high-earning Full-Stack Engineer",
    "What tech skills are highest in demand across India right now?",
    "How can I optimize my LinkedIn profile and resume to get interviews?",
  ],
  "ai-teacher": [
    "Explain Quantum Computing and superposition from first principles",
    "How does neural network backpropagation mathematically adjust weights?",
    "Why does gravity bend light if photons have zero rest mass?",
  ],
  "translator": [
    "Translate: 'Let's schedule a client call tomorrow at 10 AM' into Hindi",
    "Translate: 'Thank you for your exceptional hospitality' into Spanish",
    "Translate: 'Where is the nearest tech conference hall?' into Japanese",
  ],
};

function getModeInfo(modeSlug: string) {
  const practiceMode = getPracticeModeBySlug(modeSlug as AnyModeSlug);
  const agentMode = getAgentModeBySlug(modeSlug as AnyModeSlug);
  return practiceMode || agentMode || PRACTICE_MODES[0];
}

function AudioWaveVisualizer({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center justify-center gap-1 h-5 py-1">
      {[0.4, 0.9, 1.3, 0.6, 1.1, 1.5, 0.8, 1.2, 0.5, 0.9].map((val, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.25, 1.5, 0.25] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: val * 0.15,
            ease: "easeInOut",
          }}
          className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full h-4"
        />
      ))}
    </div>
  );
}

function VoiceChat() {
  const searchParams = useSearchParams();
  const modeSlug = (searchParams.get("mode") || "free-talk") as AnyModeSlug;
  const mode = getModeInfo(modeSlug);

  // State
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);

  // Hooks
  const { messages, isLoading, sendMessage, clearMessages, addAIMessage } =
    useChatStream({
      mode: modeSlug,
      language: selectedLang.code,
      onResponse: (response) => {
        setLastResponse(response);
        setShowFeedback(true);
      },
    });

  const tts = useSpeechSynthesis();

  const handleSendTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setVoiceState("processing");

      if (tts.isSpeaking) {
        tts.cancel();
      }

      const response = await sendMessage(text);

      if (response?.reply) {
        setVoiceState("speaking");
        tts.speak(response.reply);

        const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkSpeaking);
            setVoiceState("idle");
          }
        }, 200);
      } else {
        setVoiceState("idle");
      }
    },
    [sendMessage, tts]
  );

  const silenceDetector = useSilenceDetector({
    silenceThresholdMs: 1500,
    enabled: voiceState === "listening",
    onSilenceDetected: () => {
      speech.stop();
    },
  });

  const speech = useSpeechRecognition({
    language: selectedLang.code,
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      if (result.isFinal || result.transcript.length > 3) {
        silenceDetector.reset();
      }
      if (tts.isSpeaking && result.transcript.length > 3) {
        tts.cancel();
        setVoiceState("listening");
      }
    },
    onEnd: () => {
      if (speech.transcript.trim()) {
        handleSendTranscript(speech.transcript);
      } else {
        setVoiceState("idle");
      }
    },
    onError: (error) => {
      console.error("Speech error:", error);
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 2000);
    },
  });

  const handleOrbClick = useCallback(() => {
    switch (voiceState) {
      case "idle":
      case "error":
        speech.start();
        setVoiceState("listening");
        setShowFeedback(false);
        break;
      case "listening":
        speech.stop();
        break;
      case "speaking":
        tts.cancel();
        setVoiceState("idle");
        break;
      case "processing":
        break;
    }
  }, [voiceState, speech, tts]);

  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (textInput.trim()) {
        handleSendTranscript(textInput.trim());
        setTextInput("");
      }
    },
    [textInput, handleSendTranscript]
  );

  useEffect(() => {
    if (!hasGreetedRef.current && mode) {
      hasGreetedRef.current = true;
      addAIMessage(mode.openingPrompt);
    }
  }, [mode, addAIMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewConversation = useCallback(() => {
    clearMessages();
    tts.cancel();
    speech.reset();
    setVoiceState("idle");
    setLastResponse(null);
    setShowFeedback(false);
    hasGreetedRef.current = false;
  }, [clearMessages, tts, speech]);

  const silenceProgress =
    voiceState === "listening"
      ? Math.min(silenceDetector.timeSinceLastSpeech / 1500, 1)
      : 0;

  const suggestions = MODE_SUGGESTIONS[modeSlug] || MODE_SUGGESTIONS["free-talk"];

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-5xl mx-auto space-y-3">
      {/* ─── Top Control Header ────────────────────────────────────── */}
      <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center justify-between border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mode.gradient || "from-indigo-500 to-purple-600"} flex items-center justify-center shadow-md`}
          >
            <span className="text-white text-sm font-bold">
              {mode.title[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">{mode.title}</h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                AI Mode
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{mode.aiPersona}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language picker */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="text-xs gap-1.5 h-8 px-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              title="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedLang.flag} {selectedLang.label.split(" ")[0]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 glass-panel border border-white/15 rounded-2xl shadow-2xl overflow-hidden w-56 p-1"
                >
                  <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang);
                          setShowLangPicker(false);
                          handleNewConversation();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-white/10 transition-colors ${
                          lang.code === selectedLang.code
                            ? "bg-indigo-500/20 text-indigo-300 font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                        {lang.code === selectedLang.code && (
                          <span className="ml-auto text-indigo-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="New conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTextInput(!showTextInput)}
            className={`w-8 h-8 rounded-full hover:bg-white/10 ${
              showTextInput ? "bg-indigo-500/20 text-indigo-300" : "text-muted-foreground"
            }`}
            title="Toggle text input"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Chat and Voice Workspace ──────────────────────────────── */}
      <div className="flex-1 flex flex-col rounded-3xl glass-panel border border-white/10 overflow-hidden relative shadow-2xl">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Quick Suggestion Chips (shown when chat is new) */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4 max-w-xl mx-auto space-y-2 text-center"
            >
              <p className="text-xs font-semibold text-muted-foreground/80 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Try asking Jarvis right now:</span>
              </p>
              <div className="flex flex-col gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendTranscript(sug)}
                    className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all hover:scale-[1.01] hover:border-indigo-500/40"
                  >
                    💡 &ldquo;{sug}&rdquo;
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Voice Control Bottom Panel */}
        <div className="border-t border-white/10 bg-background/70 backdrop-blur-xl pt-2 pb-4">
          {/* Audio Wave Visualizer */}
          <AudioWaveVisualizer
            active={voiceState === "listening" || voiceState === "speaking"}
          />

          {/* Live transcript text */}
          <AnimatePresence>
            {(voiceState === "listening" ||
              speech.transcript ||
              speech.interimTranscript) && (
              <div className="px-4 py-1">
                <LiveTranscript
                  transcript={speech.transcript}
                  interimTranscript={speech.interimTranscript}
                  isListening={voiceState === "listening"}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Orb */}
          <div className="flex justify-center">
            <VoiceOrb
              state={voiceState}
              onClick={handleOrbClick}
              silenceProgress={silenceProgress}
            />
          </div>

          {/* Text input form */}
          <AnimatePresence>
            {showTextInput && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleTextSubmit}
                className="px-4 pt-3 overflow-hidden"
              >
                <div className="flex gap-2 max-w-2xl mx-auto">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={`Ask Jarvis anything in ${mode.title}...`}
                    className="flex-1 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-xl text-sm"
                    disabled={isLoading}
                    maxLength={1000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!textInput.trim() || isLoading}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback Panel */}
        <AgentFeedbackPanel
          response={lastResponse}
          isVisible={showFeedback}
          mode={modeSlug}
        />
      </div>

      {/* Browser voice notice if needed */}
      {!speech.isSupported && (
        <div className="text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
          ⚠️ Voice recognition works best in Chrome or Edge. You can also use the keyboard input above!
        </div>
      )}
    </div>
  );
}

export default function VoiceChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-muted-foreground animate-pulse text-sm">
          Initializing Jarvis Voice Matrix...
        </div>
      }
    >
      <VoiceChat />
    </Suspense>
  );
}
