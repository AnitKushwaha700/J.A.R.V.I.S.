'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Mic,
  Code2,
  Globe,
  Brain,
  CheckSquare,
  Settings,
  Activity,
  Bot,
  Command,
  ShieldCheck,
} from 'lucide-react';
import { registerGlobalShortcut } from '../lib/desktop/shortcuts';

interface NavItem {
  href: string;
  label: string;
  Icon: any;
}

export const DesktopShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [shortcutNotified, setShortcutNotified] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    db: string;
    ai: string;
  }>({ db: 'checking...', ai: 'ready' });

  useEffect(() => {
    // Register global shortcut (Ctrl+Shift+J)
    const unregister = registerGlobalShortcut(() => {
      setShortcutNotified(true);
      setTimeout(() => setShortcutNotified(false), 2500);
    });

    // Check backend health
    fetch('http://localhost:3001/api/health')
      .then((r) => r.json())
      .then((data) => {
        setHealthStatus({
          db: data.services?.database === 'ok' ? 'online' : 'connected',
          ai: 'active',
        });
      })
      .catch(() => {
        setHealthStatus({ db: 'standby', ai: 'offline-mode' });
      });

    return () => unregister();
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'Chat', Icon: MessageSquare },
    { href: '/voice', label: 'Voice Assistant', Icon: Mic },
    { href: '/code', label: 'Code Studio', Icon: Code2 },
    { href: '/research', label: 'Web Research', Icon: Globe },
    { href: '/memory', label: 'Memory & RAG', Icon: Brain },
    { href: '/tasks', label: 'Tasks & Briefing', Icon: CheckSquare },
    { href: '/settings', label: 'Settings & Health', Icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans select-none">
      {/* Shortcut notification banner */}
      {shortcutNotified && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#111827] border border-sky-500/50 text-sky-400 px-3.5 py-2 rounded-xl shadow-2xl animate-bounce">
          <Command size={14} />
          <span className="text-xs font-bold">Global Shortcut Triggered (Ctrl+Shift+J)</span>
        </div>
      )}

      {/* Left Navigation Dock */}
      <aside className="w-64 bg-[#0d1322] border-r border-[#1a2336] flex flex-col justify-between p-3.5 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-[#1f293d]/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Bot size={20} className="text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-sm text-white">JARVIS</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  DESKTOP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">v2.0 • Windows x64</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const IconComp = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-[#151e33] hover:text-slate-200'
                  }`}
                >
                  <IconComp size={16} className={active ? 'text-sky-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Health Widget */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1f293d]/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Activity size={11} className="text-emerald-400" /> SYSTEM MONITOR
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>Database</span>
              <span className="text-emerald-400 font-mono font-medium capitalize">
                {healthStatus.db}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>AI Providers</span>
              <span className="text-sky-400 font-mono font-medium">Groq / Gemini</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Shortcut</span>
              <span className="text-slate-300 font-mono text-[10px]">Ctrl+Shift+J</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-[#090d16]">{children}</main>
    </div>
  );
};
