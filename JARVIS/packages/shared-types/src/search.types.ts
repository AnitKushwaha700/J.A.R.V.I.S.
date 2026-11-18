export type SearchSource =
  | 'wikipedia'
  | 'openmeteo'
  | 'coingecko'
  | 'github'
  | 'arxiv'
  | 'duckduckgo'
  | 'news';

export interface CitationCard {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: SearchSource | string;
  publishedDate?: string;
  author?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface ResearchQueryDto {
  query: string;
  sources?: SearchSource[];
  synthesize?: boolean;
  maxResultsPerSource?: number;
}

export interface ResearchSearchResult {
  query: string;
  summary?: string;
  citations: CitationCard[];
  sourcesUsed: string[];
  executedAt: string;
  latencyMs: number;
}

export interface WeatherData {
  location: string;
  country?: string;
  latitude: number;
  longitude: number;
  temperature: number;
  temperatureUnit: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  weatherCode: number;
}

export interface CryptoData {
  coin: string;
  symbol?: string;
  currency: string;
  price: number;
  priceFormatted: string;
  change24h?: number;
  change24hFormatted?: string;
  lastUpdated?: string;
}

export interface WikiData {
  title: string;
  description?: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

export interface GitHubRepoItem {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  owner: string;
}

export interface GitHubData {
  query: string;
  totalCount: number;
  repositories: GitHubRepoItem[];
}

export interface ArXivPaperItem {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  url: string;
  pdfUrl: string;
  categories?: string[];
}

export interface ArXivData {
  query: string;
  papers: ArXivPaperItem[];
}
