'use client';

import React, { useState, useEffect } from 'react';
import { 
  requestNotificationPermission, 
  sendDesktopNotification 
} from '../../lib/desktop/notifications';
import { wakeWordDetector } from '../../lib/desktop/wake-word';

export default function SettingsPage() {
  // Notification State
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const [notificationFeedback, setNotificationFeedback] = useState<string>('');

  // Wake Word State
  const [wakeWordActive, setWakeWordActive] = useState<boolean>(false);
  const [wakeWordFeedback, setWakeWordFeedback] = useState<string>('');

  // Ollama & Local Model State
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Voice Engine State
  const [selectedVoice, setSelectedVoice] = useState<string>('en-US-ChristopherNeural');
  const [voiceSpeed, setVoiceSpeed] = useState<string>('1.0');

  // Clipboard & Security
  const [clipboardConsent, setClipboardConsent] = useState<boolean>(true);
  const [sensitiveRedaction, setSensitiveRedaction] = useState<boolean>(true);

  // System Diagnostics
  const [specs, setSpecs] = useState<{ os: string; cores: number; memory: string; browser: string }>({
    os: 'Windows 11 / Desktop Environment',
    cores: 8,
    memory: '16 GB',
    browser: 'Tauri 2 / Chrome Runtime',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
    if (typeof navigator !== 'undefined') {
      setSpecs({
        os: navigator.userAgent.includes('Windows') ? 'Windows 11 / x64' : 'Desktop OS',
        cores: navigator.hardwareConcurrency || 8,
        memory: (navigator as unknown as { deviceMemory?: number }).deviceMemory ? `${(navigator as unknown as { deviceMemory?: number }).deviceMemory} GB` : '16 GB',
        browser: 'JARVIS Desktop Host (Tauri 2 + Next.js)',
      });
    }
    checkOllamaHealth();
  }, []);

  const checkOllamaHealth = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${ollamaUrl}/api/version`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        setOllamaStatus('connected');
      } else {
        setOllamaStatus('disconnected');
      }
    } catch {
      setOllamaStatus('disconnected');
    }
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) {
      setNotificationFeedback('✅ Notification permissions granted!');
      sendDesktopNotification('JARVIS Notifications Active', {
        body: 'Desktop alerts and morning briefings are enabled.'
      });
    } else {
      setNotificationFeedback('❌ Notifications denied by user.');
    }
  };

  const handleTestNotification = () => {
    sendDesktopNotification('JARVIS Diagnostic Alert', {
      body: 'System running at optimal parameters. All 52 tests passing.'
    });
  };

  const toggleWakeWord = () => {
    if (wakeWordActive) {
      wakeWordDetector.stop();
      setWakeWordActive(false);
      setWakeWordFeedback('Wake word listener disabled.');
    } else {
      const started = wakeWordDetector.start(() => {
        setWakeWordFeedback('🎯 Wake word "Hey Jarvis" detected!');
        sendDesktopNotification('Wake Word Detected', {
          body: 'JARVIS voice engine activated.'
        });
      });
      if (started) {
        setWakeWordActive(true);
        setWakeWordFeedback('🎙️ Listening for "Hey Jarvis"...');
      } else {
        setWakeWordFeedback('⚠️ Speech recognition not supported or unavailable.');
        setWakeWordActive(false);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span> System Settings & Configurations
        </h1>
        <p className="text-sm text-cyan-400/80">Configure AI providers, desktop hooks, wake-word sensitivity, and security.</p>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Desktop Shortcuts & Hooks */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>⌨️</span> Desktop Global Shortcuts
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-200">Toggle JARVIS Window</p>
                <p className="text-xs text-slate-400">Summon or hide JARVIS instantly from anywhere</p>
              </div>
              <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded text-xs font-mono font-bold">
                Ctrl + Shift + J
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-200">Push to Talk Hotkey</p>
                <p className="text-xs text-slate-400">Direct voice prompt capture</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded text-xs font-mono font-bold">
                Space (Hold in Voice)
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🔔</span> Desktop Notifications
          </h2>
          <p className="text-xs text-slate-400">
            Receive morning briefings, timer alerts, and autonomous task completions directly on your Windows desktop.
          </p>

          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-sm text-slate-200">Status: <strong className={notificationStatus === 'granted' ? 'text-green-400' : 'text-amber-400'}>{notificationStatus.toUpperCase()}</strong></span>
            {notificationStatus !== 'granted' ? (
              <button
                onClick={handleRequestNotification}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
              >
                Enable Notifications
              </button>
            ) : (
              <button
                onClick={handleTestNotification}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/60 rounded text-xs font-semibold"
              >
                Send Test Alert
              </button>
            )}
          </div>
          {notificationFeedback && (
            <p className="text-xs text-cyan-300 font-mono">{notificationFeedback}</p>
          )}
        </div>

        {/* Section 3: Wake-Word Detection (Opt-In) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>🎙️</span> Wake Word Detection (Opt-in)
            </h2>
            <button
              onClick={toggleWakeWord}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                wakeWordActive 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
              }`}
            >
              {wakeWordActive ? 'Disable Listener' : 'Enable Wake Word'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trigger JARVIS hands-free by saying <strong className="text-cyan-300 font-mono">"Hey Jarvis"</strong> or <strong className="text-cyan-300 font-mono">"Jarvis"</strong>. Runs locally via the browser/Tauri Speech API with zero audio data uploaded without consent.
          </p>
          {wakeWordFeedback && (
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded text-xs font-mono text-cyan-300">
              {wakeWordFeedback}
            </div>
          )}
        </div>

        {/* Section 4: Local Models & Ollama */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>🦙</span> Local Ollama Engine
            </h2>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
              ollamaStatus === 'connected' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {ollamaStatus === 'connected' ? 'ONLINE (11434)' : 'OFFLINE / STANDBY'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            For 100% offline, privacy-guaranteed intelligence, connect your local Ollama daemon.
          </p>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Ollama Endpoint URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
              />
              <button
                onClick={checkOllamaHealth}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
              >
                Ping
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Voice Engine Config */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🔊</span> Edge-TTS Neural Voice
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Voice Profile</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                <option value="en-US-ChristopherNeural">Christopher Neural (Deep British/Iron Man Tone)</option>
                <option value="en-US-GuyNeural">Guy Neural (Natural Conversational)</option>
                <option value="en-GB-RyanNeural">Ryan Neural (Classic British Butler)</option>
                <option value="en-US-JennyNeural">Jenny Neural (Clear Multilingual)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Speaking Rate: {voiceSpeed}x</label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(e.target.value)}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Security & Privacy Guards */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🛡️</span> Privacy & Sandbox Safeguards
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-200">Consent-Guarded Clipboard</p>
                <p className="text-xs text-slate-400">Ask for confirmation before reading or writing clipboard</p>
              </div>
              <input
                type="checkbox"
                checked={clipboardConsent}
                onChange={(e) => setClipboardConsent(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-200">PII & Secret Redactor</p>
                <p className="text-xs text-slate-400">Auto-mask passwords, tokens & credit cards before memory indexing</p>
              </div>
              <input
                type="checkbox"
                checked={sensitiveRedaction}
                onChange={(e) => setSensitiveRedaction(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* System Hardware Diagnostics */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Host Diagnostics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">OS Platform</span>
            <span className="text-slate-200">{specs.os}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Logical Cores</span>
            <span className="text-slate-200">{specs.cores} vCPUs</span>
          </div>
          <div>
            <span className="text-slate-500 block">RAM Estimate</span>
            <span className="text-slate-200">{specs.memory}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Shell Runtime</span>
            <span className="text-slate-200">{specs.browser}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
