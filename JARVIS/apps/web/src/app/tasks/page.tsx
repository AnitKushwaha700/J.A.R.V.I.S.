'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Volume2,
  Sparkles,
  Cloud,
  StopCircle,
  RefreshCw,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, DailyBriefing } from '@jarvis/shared-types';

export default function DesktopTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      userId: 'user-1',
      title: 'Review pull request for AI Gateway streaming',
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 3600000).toISOString(),
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      userId: 'user-1',
      title: 'Test isolated code execution sandbox with infinite loops',
      priority: 'high',
      status: 'todo',
      dueAt: null,
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      userId: 'user-1',
      title: 'Verify multi-source public API research endpoints',
      priority: 'medium',
      status: 'completed',
      dueAt: null,
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/tasks/briefing?location=Mumbai')
      .then((r) => r.json())
      .then((data) => setBriefing(data.data || data))
      .catch(() => {});
  }, []);

  const handleToggle = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'completed' ? 'todo' : 'completed' } : t,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleAdd = () => {
    if (!inputTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      userId: 'user-1',
      title: inputTitle.trim(),
      priority: inputTitle.toLowerCase().includes('urgent') ? 'high' : 'medium',
      status: 'todo',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    setInputTitle('');
  };

  const handleToggleBriefingAudio = () => {
    if (isPlayingBriefing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingBriefing(false);
    } else {
      setIsPlayingBriefing(true);
      const audio = new Audio('http://localhost:3001/api/tasks/briefing/audio?location=Mumbai');
      audioRef.current = audio;
      audio.onended = () => setIsPlayingBriefing(false);
      audio.onerror = () => {
        setIsPlayingBriefing(false);
        // Fallback to Web Speech Synthesis if audio fails
        if (briefing?.spokenScript && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(briefing.spokenScript);
          window.speechSynthesis.speak(utter);
        }
      };
      audio.play().catch(() => setIsPlayingBriefing(false));
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'pending') return t.status !== 'completed';
    if (activeFilter === 'completed') return t.status === 'completed';
    if (activeFilter === 'high') return t.priority === 'high' && t.status !== 'completed';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f293d]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <CheckSquare size={20} className="text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Productivity Dashboard</h1>
              <p className="text-xs text-slate-400">Context-aware briefings and schedule management</p>
            </div>
          </div>
        </div>

        {/* Daily Morning Briefing Card */}
        {briefing && (
          <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] border border-sky-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> {briefing.greeting}
              </span>

              <button
                onClick={handleToggleBriefingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30 transition-all font-bold text-xs"
              >
                {isPlayingBriefing ? (
                  <>
                    <StopCircle size={14} className="text-rose-400 fill-current" />
                    <span className="text-rose-400">Stop Briefing</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={14} />
                    <span>Listen Briefing</span>
                  </>
                )}
              </button>
            </div>

            <h3 className="text-sm font-semibold text-white">{briefing.dateTime}</h3>

            {briefing.weather && (
              <div className="flex items-center gap-2 bg-[#090d16] border border-[#1f293d] rounded-xl px-3.5 py-2 text-xs text-slate-300">
                <Cloud size={14} className="text-sky-400" />
                <span>
                  {briefing.weather.location}: {briefing.weather.temperature}°C •{' '}
                  {briefing.weather.condition}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#1f293d] text-xs text-slate-400">
              <span>
                Pending Tasks: <strong className="text-amber-400">{briefing.pendingCount}</strong>
              </span>
              <span>
                Neural Systems: <strong className="text-emerald-400">Operational (100%)</strong>
              </span>
            </div>
          </div>
        )}

        {/* Quick Add Input Bar */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-2.5 flex items-center shadow-md">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a new task (e.g. 'Deploy microservices tomorrow at 5 PM urgently')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-3"
          />
          <button
            onClick={handleAdd}
            disabled={!inputTitle.trim()}
            className="px-4 py-2 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'high', label: 'High Priority 🔥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === tab.id
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm'
                  : 'bg-[#111827] text-slate-400 border-[#1f293d] hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const isDone = t.status === 'completed';
            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isDone
                    ? 'bg-[#111827]/40 border-[#1f293d]/40 opacity-60'
                    : 'bg-[#111827] border-[#1f293d] shadow-sm'
                }`}
              >
                <div
                  onClick={() => handleToggle(t.id)}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Circle size={18} className="text-slate-500" />
                  )}
                  <div>
                    <p
                      className={`text-sm ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-100 font-medium'
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.dueAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <Clock size={11} />
                        <span>{new Date(t.dueAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      t.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : t.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
