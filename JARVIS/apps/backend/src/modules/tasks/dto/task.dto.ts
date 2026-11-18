import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { TaskStatus, TaskPriority } from '@jarvis/shared-types';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: TaskPriority = 'medium';

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'completed', 'skipped'])
  status?: TaskStatus = 'todo';

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'completed', 'skipped'])
  status?: TaskStatus;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  dueAt?: string;
}

export class ExtractTaskDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
