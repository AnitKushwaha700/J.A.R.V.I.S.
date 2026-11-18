import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { CodeLanguage, CodeAssistantMode } from '@jarvis/shared-types';

export class CodeGenerateDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  language?: CodeLanguage = 'typescript';

  @IsOptional()
  @IsIn(['generate', 'explain', 'debug', 'refactor', 'test'])
  mode?: CodeAssistantMode = 'generate';

  @IsOptional()
  @IsString()
  contextCode?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsBoolean()
  runTest?: boolean = true;
}

export class ProjectGenerateDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  template?: string = 'react-tailwind';

  @IsOptional()
  @IsString()
  model?: string;
}
