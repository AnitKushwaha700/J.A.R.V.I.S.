export type MemoryCategory =
  | 'fact'
  | 'preference'
  | 'instruction'
  | 'project'
  | 'general';

export interface UserMemory {
  id: string;
  userId: string;
  category: MemoryCategory | string;
  content: string;
  importance: number;
  createdAt: string;
  lastAccessed: string;
}

export interface CreateMemoryDto {
  content: string;
  category?: MemoryCategory | string;
  importance?: number;
}

export interface UpdateMemoryDto {
  content?: string;
  category?: MemoryCategory | string;
  importance?: number;
}

export interface MemorySearchResult {
  memory: UserMemory;
  similarityScore: number;
}

export interface KnowledgeDoc {
  id: string;
  userId: string;
  title: string;
  fileType: string;
  storagePath: string;
  chunkCount: number;
  isIndexed: boolean;
  createdAt: string;
}

export interface DocumentChunkItem {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  createdAt: string;
  similarityScore?: number;
}

export interface IngestDocumentDto {
  title: string;
  content: string;
  fileType?: string;
}

export interface RAGSearchResponse {
  query: string;
  memories: MemorySearchResult[];
  knowledgeChunks: DocumentChunkItem[];
  contextPromptSnippet?: string;
}
