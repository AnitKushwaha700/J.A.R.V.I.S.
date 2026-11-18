export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'json'
  | 'html'
  | 'css'
  | 'sql'
  | 'markdown'
  | 'rust'
  | 'go'
  | 'shell';

export interface CodeExecutionRequest {
  language: CodeLanguage;
  code: string;
  timeoutMs?: number;
  input?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  exitCode?: number;
  error?: string;
  testedInSandbox: boolean;
}

export type CodeAssistantMode =
  | 'generate'
  | 'explain'
  | 'debug'
  | 'refactor'
  | 'test';

export interface CodeGenerateRequest {
  prompt: string;
  language?: CodeLanguage;
  mode?: CodeAssistantMode;
  contextCode?: string;
  model?: string;
  runTest?: boolean;
}

export interface CodeGenerateResult {
  code: string;
  language: CodeLanguage;
  explanation: string;
  mode: CodeAssistantMode;
  executionResult?: CodeExecutionResult;
  files?: Record<string, string>;
}

export interface ProjectFile {
  path: string;
  content: string;
  language?: CodeLanguage;
}

export interface GeneratedProject {
  name: string;
  description: string;
  template?: string;
  files: ProjectFile[];
  dependencies?: Record<string, string>;
  setupInstructions: string[];
}
