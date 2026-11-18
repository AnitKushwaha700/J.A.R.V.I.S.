'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Download,
  Copy,
  Check,
  Code2,
  Terminal,
  Sparkles,
  FileCode,
  FolderTree,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react';
import JSZip from 'jszip';
import { CodeLanguage, CodeAssistantMode, ProjectFile, CodeExecutionResult } from '@jarvis/shared-types';

// Dynamically import Monaco Editor to avoid SSR hydration issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CodingWorkspacePage() {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');
  const [selectedMode, setSelectedMode] = useState<CodeAssistantMode>('generate');
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);
  const [explanation, setExplanation] = useState<string>(
    'Welcome to JARVIS Coding Studio. Write or generate algorithms, APIs, and components, then run them safely in the isolated backend sandbox.',
  );

  const [files, setFiles] = useState<ProjectFile[]>([
    {
      path: 'src/index.ts',
      language: 'typescript',
      content: `// JARVIS High-Performance LRU Cache
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  size(): number {
    return this.cache.size;
  }
}

// Sandbox Test Execution
const lru = new LRUCache<string, number>(2);
lru.put('alpha', 100);
lru.put('beta', 200);
console.log('Get alpha:', lru.get('alpha'));
lru.put('gamma', 300); // evicts beta
console.log('Get beta (should be undefined):', lru.get('beta'));
console.log('Current LRU size:', lru.size());
`,
    },
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify(
        {
          name: 'jarvis-sandbox-project',
          version: '1.0.0',
          scripts: {
            start: 'ts-node src/index.ts',
            test: 'jest',
          },
          dependencies: {
            typescript: '^5.7.0',
          },
        },
        null,
        2,
      ),
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# LRU Cache Project\n\nGenerated with JARVIS Coding Studio.\n\n## Execution\nRuns inside the isolated backend sandbox with strict 10s timeout and 128MB memory bounds.\n`,
    },
  ]);

  const currentFile = files[activeFileIndex] || files[0];

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    const updated = [...files];
    updated[activeFileIndex] = {
      ...updated[activeFileIndex],
      content: value,
    };
    setFiles(updated);
  };

  const handleRunSandbox = async () => {
    setRunning(true);
    try {
      const res = await fetch('http://localhost:3001/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentFile.language || selectedLanguage,
          code: currentFile.content,
          timeoutMs: 5000,
        }),
      });

      const data = (await res.json()) as { data?: CodeExecutionResult } & CodeExecutionResult;
      setExecResult(data.data || data);
    } catch (err: unknown) {
      setExecResult({
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Failed to reach sandbox server',
        executionTimeMs: 0,
        testedInSandbox: true,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch('http://localhost:3001/api/code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language: selectedLanguage,
          mode: selectedMode,
          contextCode: currentFile.content,
          runTest: true,
        }),
      });

      const json = await res.json();
      const data = json.data || json;

      if (data.code) {
        const filename = `${selectedMode}_${data.language === 'python' ? 'script.py' : 'solution.ts'}`;
        const newFiles = [
          { path: filename, content: data.code, language: data.language },
          ...files,
        ];
        setFiles(newFiles);
        setActiveFileIndex(0);
        setExplanation(data.explanation || 'Code generated successfully.');
        if (data.executionResult) {
          setExecResult(data.executionResult);
        }
      }
      setPrompt('');
    } catch (err: unknown) {
      setExplanation(`Generation error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.path, file.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jarvis-project-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFile = () => {
    const name = window.prompt('Enter file path (e.g., src/utils.ts):');
    if (!name) return;
    setFiles([
      ...files,
      {
        path: name,
        content: `// ${name}\nconsole.log('${name} created');\n`,
        language: name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : 'typescript',
      },
    ]);
    setActiveFileIndex(files.length);
  };

  return (
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-[#1f293d]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <Code2 size={18} className="text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              JARVIS Coding Studio
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Sandbox Live
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Monaco Editor • Isolated Execution • Multi-file Scaffolding</p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center bg-[#090d16] border border-[#1f293d] rounded-lg p-0.5 space-x-1">
          {(['generate', 'explain', 'debug', 'refactor', 'test'] as CodeAssistantMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                selectedMode === m
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunSandbox}
            disabled={running}
            className="flex items-center px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-500/20 text-[#38bdf8] border border-sky-500/40 hover:bg-sky-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <RefreshCw size={13} className="animate-spin mr-1.5" />
            ) : (
              <Play size={13} className="mr-1.5 fill-current" />
            )}
            Run Code
          </button>

          <button
            onClick={handleDownloadZip}
            className="flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1f293d] hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Download size={13} className="mr-1.5" />
            Download ZIP
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-[#1f293d] hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <aside className="w-56 bg-[#0f172a] border-r border-[#1f293d] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f293d]/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree size={13} /> Project Files
            </span>
            <button
              onClick={handleAddFile}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Add File"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full flex items-center px-3 py-1.5 text-xs font-mono text-left transition-colors ${
                  activeFileIndex === idx
                    ? 'bg-sky-500/20 text-[#38bdf8] border-r-2 border-[#38bdf8]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <FileCode size={13} className="mr-2 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-[#1f293d] text-[11px] text-slate-500">
            {files.length} active files
          </div>
        </aside>

        {/* Center: Monaco Editor */}
        <main className="flex-1 flex flex-col bg-[#1e1e1e]">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#181818] border-b border-[#282828] text-xs">
            <span className="font-mono text-slate-300">{currentFile.path}</span>
            <span className="font-mono text-slate-500 uppercase">
              {currentFile.language || 'typescript'}
            </span>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={currentFile.language || 'typescript'}
              theme="vs-dark"
              value={currentFile.content}
              onChange={handleEditorChange}
              options={{
                fontSize: 13,
                fontFamily: 'Consolas, "Fira Code", monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </main>

        {/* Right / Bottom Panel: Sandbox Console & AI Analysis */}
        <aside className="w-80 bg-[#111827] border-l border-[#1f293d] flex flex-col">
          {/* Panel Header */}
          <div className="px-3 py-2 border-b border-[#1f293d] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal size={13} className="text-[#38bdf8]" /> Sandbox Console
            </span>
            {execResult && (
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {execResult.executionTimeMs}ms
              </span>
            )}
          </div>

          {/* Console Output */}
          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-slate-950/80">
            {running && (
              <div className="text-slate-400 flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" />
                Executing code in isolated container...
              </div>
            )}

            {!running && execResult && (
              <div className="space-y-2">
                {execResult.stdout && (
                  <pre className="text-emerald-400 whitespace-pre-wrap">{execResult.stdout}</pre>
                )}
                {execResult.stderr && (
                  <pre className="text-rose-400 whitespace-pre-wrap">{execResult.stderr}</pre>
                )}
                {!execResult.stdout && !execResult.stderr && (
                  <span className="text-slate-500">Program exited cleanly (0).</span>
                )}
              </div>
            )}

            {!running && !execResult && (
              <span className="text-slate-600">
                Click &quot;Run Code&quot; to execute in isolated sandbox.
              </span>
            )}
          </div>

          {/* AI Explanation Accordion */}
          <div className="h-44 border-t border-[#1f293d] p-3 overflow-y-auto bg-[#0f172a]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8] mb-1">
              <Sparkles size={12} /> AI Copilot Analysis
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Prompt Bar */}
      <footer className="p-3 bg-[#111827] border-t border-[#1f293d]">
        <div className="flex items-center bg-[#090d16] border border-[#1f293d] rounded-xl px-3 py-1.5">
          <Terminal size={16} className="text-slate-500 mr-2" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder={`Ask JARVIS to ${selectedMode} code (e.g. "Create a Redis pub/sub queue worker")...`}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="ml-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {generating ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Generate
          </button>
        </div>
      </footer>
    </div>
  );
}
