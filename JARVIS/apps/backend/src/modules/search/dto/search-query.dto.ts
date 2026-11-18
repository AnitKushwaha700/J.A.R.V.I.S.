import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { SearchSource } from '@jarvis/shared-types';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsArray()
  sources?: SearchSource[];

  @IsOptional()
  @IsBoolean()
  synthesize?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxResultsPerSource?: number = 5;

  @IsOptional()
  @IsString()
  model?: string;
}
