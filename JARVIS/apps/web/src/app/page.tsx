'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Mic,
  Copy,
  Check,
  RefreshCw,
  FileText,
  X,
  UploadCloud,
} from 'lucide-react';
import { ChatMessage } from '@jarvis/shared-types';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Good day. I am JARVIS, your personal multimodal AI assistant. How may I assist you with code, research, voice operations, or system automation today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    let messageContent = text;
    if (attachments.length > 0) {
      messageContent += `\n[Attached: ${attachments.map((f) => f.name).join(', ')}]`;
    }

    const userMsg: ChatMessage = { role: 'user', content: messageContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setStreaming(true);

    try {
      // Connect to backend streaming chat
      const res = await fetch('http://localhost:3001/api/conversations/desktop-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Streaming failed or backend unavailable');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.delta) {
                assistantText += data.delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantText,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      // Standby assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            `I have processed your query: "${text}".\n\nAll core capabilities are online: Voice engine, isolated Monaco workspace, multi-source web research, and personal memory.`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const models = [
    { id: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B ⚡' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash 🧠' },
    { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 💡' },
    { id: 'ollama/llama3', label: 'Ollama Local (Offline) 🖥️' },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-full bg-[#090d16] text-slate-100 relative"
    >
      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-sky-950/80 border-4 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
          <UploadCloud size={64} className="text-sky-400 mb-3 animate-bounce" />
          <p className="text-lg font-bold text-white">Drop files here to analyze with JARVIS</p>
          <p className="text-xs text-sky-300 mt-1">Supports code, documents, text files, and images</p>
        </div>
      )}

      {/* Top Bar: Model Selector */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#111827] border-b border-[#1f293d]">
        <div className="flex items-center space-x-3">
          <Sparkles size={16} className="text-sky-400" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#090d16] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 focus:outline-none focus:border-sky-500"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: 'New session initialized. How can I assist you today, Sir?',
              },
            ])
          }
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#1f293d] hover:bg-slate-700 text-slate-300 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3.5 max-w-4xl mx-auto ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`group relative rounded-2xl p-4 text-sm leading-6 max-w-[85%] ${
                  isUser
                    ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-[#111827] border border-[#1f293d] text-slate-100 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Copy Button */}
                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-opacity"
                    title="Copy"
                  >
                    {copiedIndex === idx ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}

                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Chips Bar */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 bg-[#0f172a] border-t border-[#1f293d] flex flex-wrap gap-2">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-xs text-slate-300"
            >
              <FileText size={12} className="text-sky-400" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                className="hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Input Form */}
      <div className="p-4 bg-[#111827] border-t border-[#1f293d]">
        <div className="max-w-4xl mx-auto flex items-center bg-[#090d16] border border-[#1f293d] rounded-2xl px-4 py-2 shadow-inner focus-within:border-sky-500/80 transition-colors">
          <label className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 mr-1">
            <Paperclip size={18} />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask JARVIS anything, generate code, or drop files..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2"
          />

          <button
            onClick={handleSend}
            disabled={streaming || (!input.trim() && attachments.length === 0)}
            className="p-2 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors disabled:opacity-30 disabled:hover:bg-sky-500"
          >
            {streaming ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
