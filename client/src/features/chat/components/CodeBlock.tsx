"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeBlock as CodeBlockType } from "@/types";

interface CodeBlockProps {
  code: CodeBlockType;
  timeComplexity?: string;
  spaceComplexity?: string;
  keyInsight?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  sql: "SQL",
  bash: "Bash",
};

export function CodeBlock({
  code,
  timeComplexity,
  spaceComplexity,
  keyInsight,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const label = LANGUAGE_LABELS[code.language.toLowerCase()] || code.language;

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-zinc-950 dark:bg-zinc-900 text-sm mt-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/60">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700/50"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre className="overflow-x-auto p-4 text-zinc-200 leading-relaxed">
        <code className="font-mono text-xs sm:text-sm whitespace-pre">
          {code.content}
        </code>
      </pre>

      {/* Complexity + Insight footer */}
      {(timeComplexity || spaceComplexity || keyInsight) && (
        <div className="border-t border-zinc-700/60 px-4 py-3 bg-zinc-800/40 flex flex-wrap gap-3 text-xs">
          {timeComplexity && (
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <span className="text-zinc-500">Time:</span>
              <span className="font-semibold">{timeComplexity}</span>
            </span>
          )}
          {spaceComplexity && (
            <span className="flex items-center gap-1.5 text-purple-400 font-mono">
              <span className="text-zinc-500">Space:</span>
              <span className="font-semibold">{spaceComplexity}</span>
            </span>
          )}
          {keyInsight && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="text-zinc-500">💡</span>
              <span>{keyInsight}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
