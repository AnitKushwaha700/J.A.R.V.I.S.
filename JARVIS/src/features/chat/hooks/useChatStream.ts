"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { AIResponse, ChatMessage, AnyModeSlug } from "@/types";

interface UseChatStreamOptions {
  mode: AnyModeSlug;
  language?: string;
  onResponse?: (response: AIResponse) => void;
  onError?: (error: string) => void;
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  conversationId: string | null;
  sendMessage: (text: string) => Promise<AIResponse | null>;
  clearMessages: () => void;
  addAIMessage: (text: string) => void;
}

export function useChatStream(
  options: UseChatStreamOptions
): UseChatStreamReturn {
  const { mode, language, onResponse, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const onResponseRef = useRef(onResponse);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResponseRef.current = onResponse;
    onErrorRef.current = onError;
  }, [onResponse, onError]);

  const sendMessage = useCallback(
    async (text: string): Promise<AIResponse | null> => {
      if (!text.trim() || isLoading) return null;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            mode,
            conversationId: conversationIdRef.current,
            history,
            language: language || "en-US",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const aiResponse: AIResponse = await response.json();

        if (
          !conversationIdRef.current &&
          response.headers.get("x-conversation-id")
        ) {
          const newId = response.headers.get("x-conversation-id")!;
          conversationIdRef.current = newId;
          setConversationId(newId);
        }

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: aiResponse.reply,
          timestamp: new Date(),
          analysis: {
            grammarFixes: aiResponse.grammarFixes,
            betterWords: aiResponse.betterWords,
            confidenceScore: aiResponse.confidenceScore,
            cefrLevel: aiResponse.cefrLevel,
            pronunciationTip: aiResponse.pronunciationTip,
            encouragement: aiResponse.encouragement,
            // Agent extras
            code: aiResponse.code,
            timeComplexity: aiResponse.timeComplexity,
            spaceComplexity: aiResponse.spaceComplexity,
            keyInsight: aiResponse.keyInsight,
            roadmap: aiResponse.roadmap,
            skills: aiResponse.skills,
            careerTip: aiResponse.careerTip,
            subject: aiResponse.subject,
            keyPoints: aiResponse.keyPoints,
            quiz: aiResponse.quiz,
            translated: aiResponse.translated,
            fromLanguage: aiResponse.fromLanguage,
            toLanguage: aiResponse.toLanguage,
            displayText: aiResponse.displayText,
          },
        };

        setMessages((prev) => [...prev, aiMessage]);
        onResponseRef.current?.(aiResponse);

        return aiResponse;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong";
        console.error("Chat error:", errorMsg);
        onErrorRef.current?.(errorMsg);

        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "ai",
          text: "Sorry, I had trouble processing that. Could you try again?",
          timestamp: new Date(),
          analysis: {
            grammarFixes: [],
            betterWords: [],
            confidenceScore: 0,
            cefrLevel: "B1",
          },
        };
        setMessages((prev) => [...prev, errorMessage]);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, mode, language, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    setConversationId(null);
  }, []);

  const addAIMessage = useCallback((text: string) => {
    const message: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "ai",
      text,
      timestamp: new Date(),
      analysis: {
        grammarFixes: [],
        betterWords: [],
        confidenceScore: 0,
        cefrLevel: "B1",
      },
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    clearMessages,
    addAIMessage,
  };
}
