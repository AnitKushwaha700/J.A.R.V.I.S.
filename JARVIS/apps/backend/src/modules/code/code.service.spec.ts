import { Test, TestingModule } from '@nestjs/testing';
import { CodeService } from './code.service';
import { AIGatewayService } from '../ai/ai-gateway.service';

describe('CodeService', () => {
  let service: CodeService;
  let aiGatewayMock: Partial<AIGatewayService>;

  beforeEach(async () => {
    aiGatewayMock = {
      generate: jest.fn().mockResolvedValue({
        content: '```typescript\nconst sum = (a: number, b: number) => a + b;\nconsole.log(sum(10, 20));\n```\n### Explanation\nThis function calculates the sum of two numbers.',
        provider: 'offline',
        model: 'jarvis-offline-standby',
        usage: { promptTokens: 30, completionTokens: 40, totalTokens: 70 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeService,
        { provide: AIGatewayService, useValue: aiGatewayMock },
      ],
    }).compile();

    service = module.get<CodeService>(CodeService);
  });

  describe('executeCode (JavaScript Sandbox)', () => {
    it('should safely execute JavaScript and capture console.log output', async () => {
      const code = `
        const arr = [1, 2, 3, 4, 5];
        const doubled = arr.map(x => x * 2);
        console.log('Result:', doubled.join(', '));
      `;

      const result = await service.executeCode({
        language: 'javascript',
        code,
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Result: 2, 4, 6, 8, 10');
      expect(result.testedInSandbox).toBe(true);
    });

    it('should strip TypeScript type annotations and execute successfully', async () => {
      const code = `
        const greet = (name: string): string => 'Hello ' + name;
        console.log(greet('JARVIS'));
      `;

      const result = await service.executeCode({
        language: 'typescript',
        code,
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello JARVIS');
    });

    it('should catch runtime errors gracefully without crashing the server', async () => {
      const code = `
        const obj = null;
        console.log(obj.undefinedProperty);
      `;

      const result = await service.executeCode({
        language: 'javascript',
        code,
      });

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Cannot read properties of null');
    });

    it('should enforce execution timeout on infinite loops', async () => {
      const code = `while(true) {}`;

      const result = await service.executeCode({
        language: 'javascript',
        code,
        timeoutMs: 500,
      });

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('timed out');
    });

    it('should block dangerous process/child_process calls with security exception', async () => {
      const code = `require('child_process').execSync('dir');`;

      const result = await service.executeCode({
        language: 'javascript',
        code,
      });

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Security Exception');
    });
  });

  describe('generateCode', () => {
    it('should generate code and execute it in the sandbox', async () => {
      const result = await service.generateCode({
        prompt: 'Write a sum function',
        language: 'typescript',
        mode: 'generate',
        runTest: true,
      });

      expect(result).toBeDefined();
      expect(result.code).toContain('sum');
      expect(result.explanation).toContain('Explanation');
      expect(result.executionResult).toBeDefined();
      expect(result.executionResult?.stdout).toContain('30');
    });
  });

  describe('generateProject', () => {
    it('should return a multi-file project structure', async () => {
      const mockProject = {
        name: 'test-app',
        description: 'Test application',
        files: [
          { path: 'src/index.ts', content: 'console.log("ready");' },
          { path: 'package.json', content: '{"name": "test-app"}' },
        ],
        setupInstructions: ['npm install', 'npm start'],
      };

      (aiGatewayMock.generate as jest.Mock).mockResolvedValueOnce({
        content: JSON.stringify(mockProject),
        provider: 'offline',
        model: 'jarvis-offline-standby',
        usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
      });

      const project = await service.generateProject('Scaffold a test app');
      expect(project.name).toBe('test-app');
      expect(project.files.length).toBe(2);
      expect(project.files[0].path).toBe('src/index.ts');
    });
  });
});
