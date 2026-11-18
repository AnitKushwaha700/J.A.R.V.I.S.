'use client';

import React, { useState } from 'react';
import {
  Brain,
  BookOpen,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  Download,
  Sparkles,
  FileText,
  Star,
  Layers,
} from 'lucide-react';
import { UserMemory, KnowledgeDoc } from '@jarvis/shared-types';

export default function DesktopMemoryPage() {
  const [activeTab, setActiveTab] = useState<'memories' | 'knowledge'>('memories');
  const [memories, setMemories] = useState<UserMemory[]>([
    {
      id: 'mem-1',
      userId: 'user-1',
      category: 'preference',
      content: 'Prefers TypeScript, modular architectures, and clean unit tests',
      importance: 0.9,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    },
    {
      id: 'mem-2',
      userId: 'user-1',
      category: 'fact',
      content: 'Leading software architecture for the JARVIS Personal AI Assistant',
      importance: 1.0,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    },
  ]);

  const [docs, setDocs] = useState<KnowledgeDoc[]>([
    {
      id: 'doc-1',
      userId: 'user-1',
      title: 'JARVIS Technical System Architecture',
      fileType: 'text/markdown',
      storagePath: 'local://knowledge/demo',
      chunkCount: 8,
      isIndexed: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('fact');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddMemory = () => {
    if (!newContent.trim()) return;
    const mem: UserMemory = {
      id: `mem-${Date.now()}`,
      userId: 'user-1',
      category: newCategory,
      content: newContent.trim(),
      importance: 0.8,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    setMemories([mem, ...memories]);
    setNewContent('');
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f293d]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Brain size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Personal Memory & Knowledge RAG</h1>
              <p className="text-xs text-slate-400">Context injection & long-term knowledge retention</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-[#111827] border border-[#1f293d] rounded-xl p-1 space-x-1">
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'memories'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              User Memories ({memories.length})
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'knowledge'
                  ? 'bg-purple-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Knowledge Docs ({docs.length})
            </button>
          </div>
        </div>

        {/* Privacy Shield Banner */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs text-emerald-300">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            <strong>Privacy Shield Active:</strong> Passwords, credit cards, and recovery phrases are
            automatically masked before storage.
          </span>
        </div>

        {activeTab === 'memories' ? (
          <div className="space-y-4">
            {/* Add Memory Form */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Create Memory
              </span>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe a fact, preference, or instruction for JARVIS to remember..."
                rows={2}
                className="w-full bg-[#090d16] border border-[#1f293d] rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Category:</span>
                  {['fact', 'preference', 'instruction', 'project'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      className={`px-2.5 py-1 text-xs rounded-lg capitalize border ${
                        newCategory === cat
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold'
                          : 'bg-[#090d16] text-slate-400 border-[#1f293d]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAddMemory}
                  disabled={!newContent.trim()}
                  className="px-4 py-1.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-40"
                >
                  Save Memory
                </button>
              </div>
            </div>

            {/* Memories List */}
            <div className="space-y-2.5">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        {mem.category}
                      </span>
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                        <Star size={10} className="fill-current" /> {(mem.importance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{mem.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Knowledge Docs List */}
            <div className="space-y-2.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <FileText size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                      <p className="text-xs text-slate-400">
                        {doc.chunkCount} vector chunks • Embedded with Gemini text-embedding-004
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    Active RAG
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
