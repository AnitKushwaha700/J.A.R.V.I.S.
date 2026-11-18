import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { AIGatewayService } from '../ai/ai-gateway.service';

describe('SearchService', () => {
  let service: SearchService;
  let aiGatewayMock: Partial<AIGatewayService>;

  beforeEach(async () => {
    aiGatewayMock = {
      generate: jest.fn().mockResolvedValue({
        content: 'AI synthesized answer based on citations [1] and [2].',
        provider: 'offline',
        model: 'jarvis-offline-standby',
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: AIGatewayService, useValue: aiGatewayMock },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWeather', () => {
    it('should fetch geocoding and forecast successfully', async () => {
      const mockGeo = {
        results: [{ name: 'Paris', country: 'France', latitude: 48.85, longitude: 2.35 }],
      };
      const mockForecast = {
        current: {
          temperature_2m: 18.5,
          apparent_temperature: 17.2,
          relative_humidity_2m: 65,
          wind_speed_10m: 12.3,
          weather_code: 0,
        },
      };

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeo,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast,
        } as any);

      const result = await service.getWeather('Paris');
      expect(result).toBeDefined();
      expect(result?.location).toBe('Paris');
      expect(result?.temperature).toBe(18.5);
      expect(result?.condition).toContain('Clear sky');
    });

    it('should return null when geocoding fails', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as any);

      const result = await service.getWeather('UnknownCityxyz');
      expect(result).toBeNull();
    });
  });

  describe('getCryptoPrice', () => {
    it('should resolve crypto price and 24h change', async () => {
      const mockCoinData = {
        bitcoin: { usd: 65000, usd_24h_change: 2.45 },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoinData,
      } as any);

      const result = await service.getCryptoPrice('btc', 'usd');
      expect(result).toBeDefined();
      expect(result?.coin).toBe('bitcoin');
      expect(result?.currency).toBe('USD');
      expect(result?.price).toBe(65000);
      expect(result?.change24hFormatted).toBe('+2.45%');
    });

    it('should return null if coin is not found', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any);

      const result = await service.getCryptoPrice('fakecoinnonexistent');
      expect(result).toBeNull();
    });
  });

  describe('searchWikipedia', () => {
    it('should retrieve page summary and URL', async () => {
      const mockSummary = {
        title: 'Quantum computing',
        extract: 'Quantum computing is a rapidly-emerging technology...',
        description: 'Subfield of computing',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Quantum_computing' } },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      } as any);

      const result = await service.searchWikipedia('Quantum computing');
      expect(result).toBeDefined();
      expect(result?.title).toBe('Quantum computing');
      expect(result?.extract).toContain('Quantum computing is a rapidly-emerging');
    });
  });

  describe('searchGitHub', () => {
    it('should retrieve top starred repositories', async () => {
      const mockGhData = {
        total_count: 100,
        items: [
          {
            name: 'react',
            full_name: 'facebook/react',
            html_url: 'https://github.com/facebook/react',
            description: 'The library for web and native user interfaces.',
            stargazers_count: 220000,
            forks_count: 45000,
            language: 'JavaScript',
            updated_at: '2026-11-18T00:00:00Z',
            owner: { login: 'facebook' },
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockGhData,
      } as any);

      const result = await service.searchGitHub('react');
      expect(result).toBeDefined();
      expect(result?.totalCount).toBe(100);
      expect(result?.repositories[0].name).toBe('react');
      expect(result?.repositories[0].stars).toBe(220000);
    });
  });

  describe('searchArXiv', () => {
    it('should parse atom xml feed for research papers', async () => {
      const sampleAtomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2301.00001v1</id>
    <published>2023-01-01T00:00:00Z</published>
    <title>Quantum Supremacy in LLM Architectures</title>
    <summary>We investigate quantum attention mechanisms in large language models.</summary>
    <author><name>Dr. Alice Smith</name></author>
    <link href="http://arxiv.org/abs/2301.00001v1" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/2301.00001v1" rel="related" type="application/pdf"/>
  </entry>
</feed>`;

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => sampleAtomXml,
      } as any);

      const result = await service.searchArXiv('quantum supremacy');
      expect(result).toBeDefined();
      expect(result?.papers.length).toBe(1);
      expect(result?.papers[0].title).toBe('Quantum Supremacy in LLM Architectures');
      expect(result?.papers[0].authors).toContain('Dr. Alice Smith');
      expect(result?.papers[0].pdfUrl).toBe('http://arxiv.org/pdf/2301.00001v1');
    });
  });

  describe('unifiedResearch', () => {
    it('should aggregate citations and call AI synthesis', async () => {
      // Mock Wikipedia search
      const mockSummary = {
        title: 'Deep learning',
        extract: 'Deep learning is part of machine learning...',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Deep_learning' } },
      };

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      } as any);

      const result = await service.unifiedResearch({
        query: 'What is deep learning?',
        sources: ['wikipedia'],
        synthesize: true,
      });

      expect(result).toBeDefined();
      expect(result.query).toBe('What is deep learning?');
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.summary).toContain('AI synthesized answer');
      expect(aiGatewayMock.generate).toHaveBeenCalled();
    });
  });
});
