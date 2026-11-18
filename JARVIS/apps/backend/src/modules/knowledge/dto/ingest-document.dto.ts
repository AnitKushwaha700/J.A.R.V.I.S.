import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class IngestDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  fileType?: string = 'text/plain';
}

export class KnowledgeSearchDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  topK?: number = 4;
}
