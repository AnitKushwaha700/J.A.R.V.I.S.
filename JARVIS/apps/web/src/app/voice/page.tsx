'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  StopCircle,
  Sparkles,
  Radio,
  Settings,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { WakeWordDetector } from '../../lib/desktop/wake-word';

export default function DesktopVoicePage() {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordStatus, setWakeWordStatus] = useState<string>('Disabled (Click to enable opt-in)');
  const [selectedProfile, setSelectedProfile] = useState('jarvis');

  const wakeWordRef = useRef<WakeWordDetector | null>(null);

  useEffect(() => {
    wakeWordRef.current = new WakeWordDetector();
    return () => {
      wakeWordRef.current?.stop();
    };
  }, []);

  const toggleWakeWord = () => {
    if (!wakeWordRef.current) return;

    if (wakeWordEnabled) {
      wakeWordRef.current.stop();
      setWakeWordEnabled(false);
      setWakeWordStatus('Disabled');
    } else {
      const started = wakeWordRef.current.start(() => {
        handleStartListening();
      });
      if (started) {
        setWakeWordEnabled(true);
        setWakeWordStatus('Active: Listening for "Hey Jarvis"...');
      } else {
        setWakeWordStatus('Speech recognition not supported or mic blocked');
      }
    }
  };

  const handleStartListening = () => {
    setVoiceState('listening');
    setTranscript('Listening to your voice command...');

    // Simulate voice recording / STT recognition
    setTimeout(() => {
      setTranscript('What is the latest status of our microservices and tasks?');
      setVoiceState('processing');

      setTimeout(() => {
        setResponse(
          'All microservices are operational. You have 3 priority tasks scheduled for today. Weather in Mumbai is clear at 28 degrees Celsius.',
        );
        setVoiceState('speaking');

        // Play synthetic speech
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(
            'All microservices are operational. You have 3 priority tasks scheduled for today. Weather in Mumbai is clear at 28 degrees Celsius.',
          );
          utter.onend = () => setVoiceState('idle');
          window.speechSynthesis.speak(utter);
        } else {
          setTimeout(() => setVoiceState('idle'), 4000);
        }
      }, 1500);
    }, 2500);
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
  };

  const getOrbGlowClass = () => {
    switch (voiceState) {
      case 'listening':
        return 'from-sky-400 to-cyan-500 shadow-cyan-500/50 scale-110 animate-pulse';
      case 'processing':
        return 'from-purple-500 to-indigo-600 shadow-purple-500/50 animate-spin';
      case 'speaking':
        return 'from-emerald-400 to-teal-500 shadow-emerald-500/50 scale-105';
      default:
        return 'from-sky-600 to-indigo-700 shadow-sky-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 p-8 items-center justify-between">
      {/* Top Controls Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-[#111827] border border-[#1f293d] p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <Radio size={18} className="text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Neural Voice Engine</h2>
            <p className="text-[11px] text-slate-400">Microsoft Edge-TTS • Groq Whisper STT</p>
          </div>
        </div>

        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="bg-[#090d16] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
        >
          <option value="jarvis">JARVIS (Neural British)</option>
          <option value="friday">FRIDAY (Neural Irish)</option>
          <option value="mentor">Mentor (Neural American)</option>
          <option value="hindi">Hindi Native (Swara)</option>
        </select>
      </div>

      {/* Center: Glowing Pulsating Voice Orb */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative flex items-center justify-center">
          {/* Outer glow aura */}
          <div
            className={`w-56 h-56 rounded-full bg-gradient-to-tr ${getOrbGlowClass()} opacity-80 blur-2xl transition-all duration-700`}
          />

          {/* Central Orb Sphere */}
          <div
            onClick={voiceState === 'idle' ? handleStartListening : handleStop}
            className={`absolute w-44 h-44 rounded-full bg-gradient-to-tr ${getOrbGlowClass()} flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300 active:scale-95`}
          >
            {voiceState === 'speaking' ? (
              <Volume2 size={48} className="text-slate-950 font-bold" />
            ) : voiceState === 'listening' ? (
              <Mic size={48} className="text-slate-950 font-bold animate-bounce" />
            ) : (
              <Mic size={48} className="text-slate-950 font-bold" />
            )}
          </div>
        </div>

        {/* State Label */}
        <div className="mt-8 text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30">
            {voiceState === 'idle' && 'Tap Orb to Speak'}
            {voiceState === 'listening' && 'Listening...'}
            {voiceState === 'processing' && 'Synthesizing with Groq...'}
            {voiceState === 'speaking' && 'Speaking (Edge-TTS)...'}
          </span>
        </div>

        {/* Real-time Transcription & Response Card */}
        {(transcript || response) && (
          <div className="mt-6 max-w-xl bg-[#111827] border border-[#1f293d] p-4 rounded-2xl text-center space-y-2">
            {transcript && (
              <p className="text-xs text-slate-400 font-mono italic">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
            {response && (
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {response}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Wake-Word Opt-in Configuration Card */}
      <div className="w-full max-w-2xl bg-[#111827] border border-[#1f293d] p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Wake-Word Activation (&quot;Hey Jarvis&quot;)</span>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                Opt-In Consent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{wakeWordStatus}</p>
          </div>
        </div>

        <button
          onClick={toggleWakeWord}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            wakeWordEnabled
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              : 'bg-[#1f293d] text-slate-300 hover:bg-slate-700'
          }`}
        >
          {wakeWordEnabled ? 'Enabled' : 'Enable Wake-Word'}
        </button>
      </div>
    </div>
  );
}
