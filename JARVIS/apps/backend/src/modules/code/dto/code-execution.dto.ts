import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { CodeLanguage } from '@jarvis/shared-types';

export class CodeExecutionDto {
  @IsString()
  @IsIn([
    'javascript',
    'typescript',
    'python',
    'json',
    'html',
    'css',
    'sql',
    'markdown',
    'rust',
    'go',
    'shell',
  ])
  language: CodeLanguage;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  timeoutMs?: number = 5000;

  @IsOptional()
  @IsString()
  input?: string;
}
