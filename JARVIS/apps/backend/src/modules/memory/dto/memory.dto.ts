import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateMemoryDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  category?: string = 'general';

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  importance?: number = 0.5;
}

export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  importance?: number;
}

export class SearchMemoryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsNumber()
  topK?: number = 5;
}
