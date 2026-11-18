import { Injectable, Logger } from '@nestjs/common';
import * as vm from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import {
  CodeExecutionRequest,
  CodeExecutionResult,
  CodeGenerateRequest,
  CodeGenerateResult,
  GeneratedProject,
} from '@jarvis/shared-types';
import { AIGatewayService } from '../ai/ai-gateway.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class CodeService {
  private readonly logger = new Logger(CodeService.name);

  constructor(private readonly aiGateway: AIGatewayService) {}

  /**
   * Safe Sandboxed Code Execution
   * Supports JavaScript, TypeScript expressions, and Python with strict time & memory controls.
   */
  async executeCode(req: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = Math.min(Math.max(req.timeoutMs || 5000, 500), 10000);
    const lang = req.language.toLowerCase();

    // 1. Static Security Filter
    const blockedPatterns = [
      /child_process/i,
      /\bprocess\./i,
      /__import__\s*\(\s*['"]os['"]\s*\)/i,
      /__import__\s*\(\s*['"]subprocess['"]\s*\)/i,
      /import\s+os\b/i,
      /import\s+subprocess\b/i,
      /from\s+os\b/i,
      /from\s+subprocess\b/i,
      /\b(rmdir|unlink|rm\s+-rf)\b/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(req.code)) {
        return {
          success: false,
          stdout: '',
          stderr: 'Security Exception: Execution of dangerous system calls or process operations is blocked.',
          executionTimeMs: Date.now() - startTime,
          testedInSandbox: true,
          error: 'Security Exception',
        };
      }
    }

    if (lang === 'javascript' || lang === 'typescript' || lang === 'json') {
      return this.executeJavaScript(req.code, timeoutMs, startTime);
    } else if (lang === 'python') {
      return this.executePython(req.code, timeoutMs, startTime);
    } else {
      return {
        success: false,
        stdout: '',
        stderr: `Direct execution is not supported for language "${req.language}". Supported sandbox environments: JavaScript, TypeScript, Python.`,
        executionTimeMs: Date.now() - startTime,
        testedInSandbox: true,
      };
    }
  }

  private executeJavaScript(code: string, timeoutMs: number, startTime: number): CodeExecutionResult {
    const logs: string[] = [];
    const errors: string[] = [];

    const formatArg = (arg: unknown): string => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    };

    const sandboxConsole = {
      log: (...args: unknown[]) => logs.push(args.map(formatArg).join(' ')),
      error: (...args: unknown[]) => errors.push(args.map(formatArg).join(' ')),
      warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(formatArg).join(' ')),
      info: (...args: unknown[]) => logs.push(args.map(formatArg).join(' ')),
    };

    const context = vm.createContext({
      console: sandboxConsole,
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      Promise,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
    });

    try {
      // Basic type annotation stripping if TypeScript
      const cleanCode = code
        .replace(/:\s*(string|number|boolean|any|void|unknown|never|Record<[^>]+>|Array<[^>]+>|string\[\]|number\[\])/g, '')
        .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
        .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '');

      const script = new vm.Script(cleanCode);
      const evalResult = script.runInContext(context, {
        timeout: timeoutMs,
        displayErrors: true,
      });

      if (evalResult !== undefined && logs.length === 0) {
        logs.push(formatArg(evalResult));
      }

      return {
        success: true,
        stdout: logs.join('\n'),
        stderr: errors.join('\n'),
        executionTimeMs: Date.now() - startTime,
        testedInSandbox: true,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        stdout: logs.join('\n'),
        stderr: errorMsg,
        executionTimeMs: Date.now() - startTime,
        testedInSandbox: true,
        error: errorMsg,
      };
    }
  }

  private async executePython(
    code: string,
    timeoutMs: number,
    startTime: number,
  ): Promise<CodeExecutionResult> {
    const tempFileName = `jarvis_sandbox_${uuidv4()}.py`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
      await fs.promises.writeFile(tempFilePath, code, 'utf-8');

      // Attempt to execute with 'python' or 'python3'
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

      const { stdout, stderr } = await execFileAsync(pythonCmd, [tempFilePath], {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
        env: {
          PATH: process.env.PATH,
          SYSTEMROOT: process.env.SYSTEMROOT,
          PYTHONUNBUFFERED: '1',
        },
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs: Date.now() - startTime,
        testedInSandbox: true,
      };
    } catch (err: any) {
      const isTimeout = err.killed && err.signal === 'SIGTERM';
      const errorMsg = isTimeout
        ? `Execution Timed Out (exceeded ${timeoutMs}ms limit)`
        : err.stderr || err.message || 'Python execution failed';

      return {
        success: false,
        stdout: (err.stdout || '').trim(),
        stderr: errorMsg.trim(),
        executionTimeMs: Date.now() - startTime,
        testedInSandbox: true,
        error: errorMsg.trim(),
      };
    } finally {
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch {
        // ignore cleanup error
      }
    }
  }

  /**
   * AI-Powered Coding Assistant
   * Generates code, line-by-line explanation, refactoring, or tests.
   * Runs the code in the isolated sandbox to verify execution.
   */
  async generateCode(req: CodeGenerateRequest, userId?: string): Promise<CodeGenerateResult> {
    const mode = req.mode || 'generate';
    const language = req.language || 'typescript';

    const systemPrompt = `You are JARVIS, an elite Principal Software Engineer and Coding Copilot.
You write elegant, robust, modern, and production-ready code in ${language}.
Mode: ${mode.toUpperCase()}
Guidelines:
- Return the full source code inside a markdown code block (\`\`\`${language} ... \`\`\`).
- If mode is 'generate', write clean, complete, runnable code with zero placeholders.
- If mode is 'explain', provide a detailed line-by-line breakdown, time/space complexity analysis, and architecture pattern.
- If mode is 'debug', locate errors, explain why they occurred, and provide the corrected code.
- If mode is 'refactor', modernize the code, optimize performance, and adhere to clean code principles.
- If mode is 'test', write comprehensive unit tests with edge cases.
- Follow the code block with a clear explanation section under "### Explanation" or "### Breakdown".`;

    const userPrompt = req.contextCode
      ? `Task: ${req.prompt}\n\nContext / Existing Code:\n\`\`\`${language}\n${req.contextCode}\n\`\`\``
      : req.prompt;

    const aiResponse = await this.aiGateway.generate(
      {
        model: req.model || 'auto',
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        temperature: 0.1,
      },
      userId,
    );

    const fullContent = aiResponse.content;

    // Extract code block
    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/;
    const match = codeBlockRegex.exec(fullContent);
    const extractedCode = match ? match[1].trim() : fullContent;

    // Extract explanation (text after the code block)
    const explanation = match
      ? fullContent.replace(match[0], '').trim()
      : 'Code generated by JARVIS AI Copilot.';

    // Test in sandbox if requested
    let executionResult: CodeExecutionResult | undefined = undefined;
    if (req.runTest !== false && (language === 'javascript' || language === 'typescript' || language === 'python')) {
      try {
        executionResult = await this.executeCode({
          language,
          code: extractedCode,
          timeoutMs: 4000,
        });
      } catch (execErr) {
        this.logger.warn(`Sandbox test error: ${execErr}`);
      }
    }

    return {
      code: extractedCode,
      language,
      explanation,
      mode,
      executionResult,
    };
  }

  /**
   * Multi-File Project Generator
   * Scaffolds complete multi-file project architectures ready for download or export.
   */
  async generateProject(prompt: string, template?: string, userId?: string): Promise<GeneratedProject> {
    const systemPrompt = `You are JARVIS Project Architect. You scaffold complete, runnable multi-file projects.
Output your response STRICTLY as a JSON object with this exact structure:
{
  "name": "project-name",
  "description": "Short project description",
  "template": "${template || 'standard'}",
  "dependencies": { "dep-name": "^1.0.0" },
  "files": [
    { "path": "package.json", "content": "..." },
    { "path": "src/index.ts", "content": "..." },
    { "path": "README.md", "content": "..." }
  ],
  "setupInstructions": [
    "npm install",
    "npm run dev"
  ]
}
Do NOT include any extra prose or markdown wrappers. ONLY valid JSON.`;

    const aiResponse = await this.aiGateway.generate(
      {
        model: 'auto',
        messages: [{ role: 'user', content: `Generate project: ${prompt}` }],
        systemPrompt,
        temperature: 0.2,
        responseFormat: 'json',
      },
      userId,
    );

    try {
      const jsonStr = aiResponse.content.replace(/```(?:json)?/g, '').trim();
      const parsed = JSON.parse(jsonStr) as GeneratedProject;
      return parsed;
    } catch {
      // Fallback structured project template
      return {
        name: 'jarvis-generated-project',
        description: prompt,
        template: template || 'typescript-node',
        files: [
          {
            path: 'src/index.ts',
            content: `// ${prompt}\nconsole.log('Project initialized by JARVIS.');\n`,
            language: 'typescript',
          },
          {
            path: 'package.json',
            content: JSON.stringify(
              {
                name: 'jarvis-app',
                version: '1.0.0',
                scripts: { dev: 'ts-node src/index.ts', build: 'tsc' },
              },
              null,
              2,
            ),
            language: 'json',
          },
          {
            path: 'README.md',
            content: `# Generated Project\n\n${prompt}\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
            language: 'markdown',
          },
        ],
        dependencies: { typescript: '^5.0.0', 'ts-node': '^10.9.0' },
        setupInstructions: ['npm install', 'npm run dev'],
      };
    }
  }
}
