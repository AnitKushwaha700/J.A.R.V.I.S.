import { Injectable, Logger } from '@nestjs/common';
import {
  CitationCard,
  ResearchSearchResult,
  WeatherData,
  CryptoData,
  WikiData,
  GitHubData,
  ArXivData,
  SearchSource,
} from '@jarvis/shared-types';
import { SearchQueryDto } from './dto/search-query.dto';
import { AIGatewayService } from '../ai/ai-gateway.service';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly aiGateway: AIGatewayService) {}

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setInCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /**
   * 1. Open-Meteo Weather API (100% Free, Zero Key)
   */
  async getWeather(location: string): Promise<WeatherData | null> {
    const cacheKey = `weather:${location.toLowerCase().trim()}`;
    const cached = this.getFromCache<WeatherData>(cacheKey);
    if (cached) return cached;

    try {
      // Step A: Geocoding
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location,
      )}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
      if (!geoRes.ok) return null;

      const geoData = (await geoRes.json()) as {
        results?: Array<{
          name: string;
          country?: string;
          latitude: number;
          longitude: number;
        }>;
      };

      const place = geoData.results?.[0];
      if (!place) return null;

      // Step B: Weather Forecast
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius`;
      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(5000) });
      if (!weatherRes.ok) return null;

      const weatherData = (await weatherRes.json()) as {
        current: {
          temperature_2m: number;
          apparent_temperature: number;
          relative_humidity_2m: number;
          wind_speed_10m: number;
          weather_code: number;
        };
      };

      const current = weatherData.current;
      const weatherCodeMap: Record<number, string> = {
        0: 'Clear sky ☀️',
        1: 'Mainly clear 🌤️',
        2: 'Partly cloudy ⛅',
        3: 'Overcast ☁️',
        45: 'Foggy 🌫️',
        48: 'Depositing rime fog 🌫️',
        51: 'Light drizzle 🌦️',
        53: 'Moderate drizzle 🌦️',
        55: 'Dense drizzle 🌧️',
        61: 'Slight rain 🌧️',
        63: 'Moderate rain 🌧️',
        65: 'Heavy rain ⛈️',
        71: 'Slight snow 🌨️',
        73: 'Moderate snow 🌨️',
        75: 'Heavy snow ❄️',
        80: 'Rain showers 🌦️',
        95: 'Thunderstorm ⚡',
      };

      const result: WeatherData = {
        location: place.name,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
        temperature: current.temperature_2m,
        temperatureUnit: '°C',
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        condition: weatherCodeMap[current.weather_code] || 'Variable conditions',
        weatherCode: current.weather_code,
      };

      this.setInCache(cacheKey, result, 600_000); // 10 min TTL
      return result;
    } catch (err) {
      this.logger.warn(`Weather lookup failed for "${location}": ${err}`);
      return null;
    }
  }

  /**
   * 2. CoinGecko Simple Price API (100% Free Tier, Zero Key)
   */
  async getCryptoPrice(coin: string, vsCurrency: string = 'usd'): Promise<CryptoData | null> {
    const aliasMap: Record<string, string> = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      doge: 'dogecoin',
      xrp: 'ripple',
      ada: 'cardano',
      bnb: 'binancecoin',
      matic: 'polygon-ecosystem-token',
      dot: 'polkadot',
      link: 'chainlink',
      avax: 'avalanche-2',
    };

    const cleanInput = coin.toLowerCase().trim();
    const coinId = aliasMap[cleanInput] || cleanInput.replace(/\s+/g, '-');
    const currency = vsCurrency.toLowerCase().trim();

    const cacheKey = `crypto:${coinId}:${currency}`;
    const cached = this.getFromCache<CryptoData>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        coinId,
      )}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true`;

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;

      const data = (await res.json()) as Record<
        string,
        Record<string, number>
      >;

      if (!data[coinId] || data[coinId][currency] === undefined) {
        return null;
      }

      const rawPrice = data[coinId][currency];
      const change24h = data[coinId][`${currency}_24h_change`];

      const result: CryptoData = {
        coin: coinId,
        currency: currency.toUpperCase(),
        price: rawPrice,
        priceFormatted: rawPrice.toLocaleString('en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }),
        change24h: change24h !== undefined ? Number(change24h.toFixed(2)) : undefined,
        change24hFormatted:
          change24h !== undefined
            ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`
            : undefined,
        lastUpdated: new Date().toISOString(),
      };

      this.setInCache(cacheKey, result, 120_000); // 2 min TTL
      return result;
    } catch (err) {
      this.logger.warn(`Crypto price lookup failed for "${coin}": ${err}`);
      return null;
    }
  }

  /**
   * 3. Wikipedia REST Summary & Search API (100% Free, Zero Key)
   */
  async searchWikipedia(query: string): Promise<WikiData | null> {
    const cleanTopic = query.trim().replace(/\s+/g, '_');
    const cacheKey = `wiki:${cleanTopic.toLowerCase()}`;
    const cached = this.getFromCache<WikiData>(cacheKey);
    if (cached) return cached;

    try {
      // Try direct summary lookup
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        cleanTopic,
      )}`;
      const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(5000) });

      if (res.ok) {
        const data = (await res.json()) as {
          title: string;
          description?: string;
          extract: string;
          content_urls?: { desktop?: { page?: string } };
          thumbnail?: { source?: string };
        };

        if (data.extract) {
          const result: WikiData = {
            title: data.title,
            description: data.description,
            extract: data.extract,
            url:
              data.content_urls?.desktop?.page ||
              `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTopic)}`,
            thumbnail: data.thumbnail?.source,
          };
          this.setInCache(cacheKey, result, 3_600_000); // 1 hour TTL
          return result;
        }
      }

      // Fallback: Search Wikipedia API
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query,
      )}&format=json&utf8=1`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      if (!searchRes.ok) return null;

      const searchData = (await searchRes.json()) as {
        query?: { search?: Array<{ title: string; snippet: string }> };
      };

      const firstHit = searchData.query?.search?.[0];
      if (!firstHit) return null;

      const hitTitle = firstHit.title.replace(/\s+/g, '_');
      const hitRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hitTitle)}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (hitRes.ok) {
        const hitData = (await hitRes.json()) as {
          title: string;
          description?: string;
          extract: string;
          content_urls?: { desktop?: { page?: string } };
          thumbnail?: { source?: string };
        };
        const result: WikiData = {
          title: hitData.title,
          description: hitData.description,
          extract: hitData.extract,
          url:
            hitData.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(hitTitle)}`,
          thumbnail: hitData.thumbnail?.source,
        };
        this.setInCache(cacheKey, result, 3_600_000);
        return result;
      }

      return null;
    } catch (err) {
      this.logger.warn(`Wikipedia search failed for "${query}": ${err}`);
      return null;
    }
  }

  /**
   * 4. GitHub Public Repository Search (Free, Zero Key)
   */
  async searchGitHub(query: string, limit: number = 5): Promise<GitHubData | null> {
    const cacheKey = `github:${query.toLowerCase().trim()}:${limit}`;
    const cached = this.getFromCache<GitHubData>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query,
      )}&sort=stars&order=desc&per_page=${limit}`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'JARVIS-Personal-AI-Assistant/2.0',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as {
        total_count: number;
        items?: Array<{
          name: string;
          full_name: string;
          html_url: string;
          description: string | null;
          stargazers_count: number;
          forks_count: number;
          language: string | null;
          updated_at: string;
          owner: { login: string };
        }>;
      };

      const repos = (data.items || []).map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        owner: repo.owner.login,
      }));

      const result: GitHubData = {
        query,
        totalCount: data.total_count,
        repositories: repos,
      };

      this.setInCache(cacheKey, result, 900_000); // 15 min TTL
      return result;
    } catch (err) {
      this.logger.warn(`GitHub search failed for "${query}": ${err}`);
      return null;
    }
  }

  /**
   * 5. arXiv Scientific Papers Search (100% Free, Zero Key)
   */
  async searchArXiv(query: string, limit: number = 5): Promise<ArXivData | null> {
    const cacheKey = `arxiv:${query.toLowerCase().trim()}:${limit}`;
    const cached = this.getFromCache<ArXivData>(cacheKey);
    if (cached) return cached;

    try {
      const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
        query,
      )}&start=0&max_results=${limit}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;

      const xml = await res.text();
      const entries: ArXivData['papers'] = [];

      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      let match: RegExpExecArray | null;

      while ((match = entryRegex.exec(xml)) !== null) {
        const entryBlock = match[1];

        const idMatch = /<id>([\s\S]*?)<\/id>/i.exec(entryBlock);
        const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(entryBlock);
        const summaryMatch = /<summary>([\s\S]*?)<\/summary>/i.exec(entryBlock);
        const publishedMatch = /<published>([\s\S]*?)<\/published>/i.exec(entryBlock);
        const pdfMatch = /<link[^>]*title=["']pdf["'][^>]*href=["']([^"']+)["']/i.exec(entryBlock);
        const altMatch = /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i.exec(entryBlock);

        // Authors
        const authors: string[] = [];
        const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/gi;
        let authorMatch: RegExpExecArray | null;
        while ((authorMatch = authorRegex.exec(entryBlock)) !== null) {
          authors.push(authorMatch[1].trim());
        }

        const id = idMatch ? idMatch[1].trim() : '';
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Untitled Paper';
        const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
        const published = publishedMatch ? publishedMatch[1].trim() : '';
        const paperUrl = altMatch ? altMatch[1].trim() : id;
        const pdfUrl = pdfMatch ? pdfMatch[1].trim() : paperUrl.replace('/abs/', '/pdf/');

        entries.push({
          id,
          title,
          authors: authors.slice(0, 5),
          summary: summary.slice(0, 400) + (summary.length > 400 ? '...' : ''),
          published,
          url: paperUrl,
          pdfUrl,
        });
      }

      const result: ArXivData = {
        query,
        papers: entries,
      };

      this.setInCache(cacheKey, result, 7_200_000); // 2 hour TTL
      return result;
    } catch (err) {
      this.logger.warn(`arXiv search failed for "${query}": ${err}`);
      return null;
    }
  }

  /**
   * 6. DuckDuckGo Instant Answer / Search (Free, Zero Key)
   */
  async searchDuckDuckGo(query: string): Promise<CitationCard[]> {
    const cacheKey = `ddg:${query.toLowerCase().trim()}`;
    const cached = this.getFromCache<CitationCard[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
        query,
      )}&format=json&no_html=1&skip_disambig=1`;

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        Heading?: string;
        AbstractText?: string;
        AbstractURL?: string;
        AbstractSource?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      };

      const cards: CitationCard[] = [];

      if (data.AbstractText && data.AbstractURL) {
        cards.push({
          id: `ddg-1`,
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: data.AbstractText,
          source: data.AbstractSource || 'DuckDuckGo',
        });
      }

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (let i = 0; i < Math.min(data.RelatedTopics.length, 3); i++) {
          const item = data.RelatedTopics[i];
          if (item.Text && item.FirstURL) {
            cards.push({
              id: `ddg-rel-${i + 1}`,
              title: item.Text.split(' - ')[0] || item.Text.slice(0, 50),
              url: item.FirstURL,
              snippet: item.Text,
              source: 'DuckDuckGo',
            });
          }
        }
      }

      this.setInCache(cacheKey, cards, 900_000);
      return cards;
    } catch (err) {
      this.logger.warn(`DuckDuckGo search failed for "${query}": ${err}`);
      return [];
    }
  }

  /**
   * 7. News & Top Current Trends (Hacker News Algolia + optional NewsAPI)
   */
  async searchNews(query: string, limit: number = 5): Promise<CitationCard[]> {
    const cacheKey = `news:${query.toLowerCase().trim()}:${limit}`;
    const cached = this.getFromCache<CitationCard[]>(cacheKey);
    if (cached) return cached;

    const cards: CitationCard[] = [];

    try {
      // Primary News Source: HN Algolia (100% Free, zero key, reliable tech & world news)
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        query,
      )}&tags=story&hitsPerPage=${limit}`;

      const hnRes = await fetch(hnUrl, { signal: AbortSignal.timeout(5000) });
      if (hnRes.ok) {
        const hnData = (await hnRes.json()) as {
          hits?: Array<{
            objectID: string;
            title: string;
            url?: string;
            points?: number;
            author?: string;
            created_at?: string;
          }>;
        };

        for (const hit of hnData.hits || []) {
          if (hit.title) {
            cards.push({
              id: `hn-${hit.objectID}`,
              title: hit.title,
              url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              snippet: `Discussion score: ${hit.points || 0} points by @${hit.author || 'author'}`,
              source: 'Hacker News',
              publishedDate: hit.created_at,
              author: hit.author,
            });
          }
        }
      }

      // Optional NewsAPI fallback if key is configured
      const newsApiKey = process.env.NEWS_API_KEY;
      if (newsApiKey && cards.length < limit) {
        try {
          const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
            query,
          )}&sortBy=relevancy&pageSize=${limit}&apiKey=${newsApiKey}`;
          const nRes = await fetch(newsUrl, { signal: AbortSignal.timeout(5000) });
          if (nRes.ok) {
            const nData = (await nRes.json()) as {
              articles?: Array<{
                title: string;
                url: string;
                description?: string;
                source?: { name: string };
                publishedAt?: string;
                author?: string;
              }>;
            };
            for (const art of nData.articles || []) {
              cards.push({
                id: `newsapi-${encodeURIComponent(art.url).slice(-10)}`,
                title: art.title,
                url: art.url,
                snippet: art.description || '',
                source: art.source?.name || 'NewsAPI',
                publishedDate: art.publishedAt,
                author: art.author,
              });
            }
          }
        } catch {
          // ignore newsapi failure
        }
      }

      this.setInCache(cacheKey, cards, 900_000);
      return cards;
    } catch (err) {
      this.logger.warn(`News search failed for "${query}": ${err}`);
      return [];
    }
  }

  /**
   * Unified Research Engine
   * Executes parallel queries across selected or auto-detected public sources,
   * deduplicates references, builds citation cards, and produces an AI synthesis.
   */
  async unifiedResearch(
    dto: SearchQueryDto,
    userId?: string,
  ): Promise<ResearchSearchResult> {
    const startTime = Date.now();
    const query = dto.query.trim();
    const citations: CitationCard[] = [];
    const sourcesUsed = new Set<string>();

    // 1. Determine sources to query
    let sourcesToQuery = dto.sources;
    if (!sourcesToQuery || sourcesToQuery.length === 0) {
      sourcesToQuery = this.detectSources(query);
    }

    // 2. Dispatch parallel requests with timeout guards
    const tasks: Promise<void>[] = [];

    if (sourcesToQuery.includes('wikipedia')) {
      tasks.push(
        this.searchWikipedia(query).then((wiki) => {
          if (wiki) {
            sourcesUsed.add('Wikipedia');
            citations.push({
              id: 'wiki-1',
              title: wiki.title,
              url: wiki.url,
              snippet: wiki.extract,
              source: 'Wikipedia',
              icon: wiki.thumbnail,
              metadata: { description: wiki.description },
            });
          }
        }),
      );
    }

    if (sourcesToQuery.includes('openmeteo')) {
      // Extract location from query (e.g. "weather in Tokyo" -> "Tokyo")
      const loc = this.extractLocationFromQuery(query);
      tasks.push(
        this.getWeather(loc).then((weather) => {
          if (weather) {
            sourcesUsed.add('Open-Meteo');
            citations.push({
              id: 'weather-1',
              title: `Weather in ${weather.location} (${weather.condition})`,
              url: `https://open-meteo.com/en/docs#latitude=${weather.latitude}&longitude=${weather.longitude}`,
              snippet: `Temperature: ${weather.temperature}${weather.temperatureUnit} (Feels like ${weather.feelsLike}${weather.temperatureUnit}), Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h`,
              source: 'Open-Meteo',
              metadata: { ...weather },
            });
          }
        }),
      );
    }

    if (sourcesToQuery.includes('coingecko')) {
      const coin = this.extractCoinFromQuery(query);
      tasks.push(
        this.getCryptoPrice(coin).then((crypto) => {
          if (crypto) {
            sourcesUsed.add('CoinGecko');
            citations.push({
              id: 'crypto-1',
              title: `${crypto.coin.toUpperCase()} Current Market Price`,
              url: `https://www.coingecko.com/en/coins/${encodeURIComponent(crypto.coin)}`,
              snippet: `Price: ${crypto.priceFormatted} (${crypto.currency}), 24h Change: ${crypto.change24hFormatted || 'N/A'}`,
              source: 'CoinGecko',
              metadata: { ...crypto },
            });
          }
        }),
      );
    }

    if (sourcesToQuery.includes('github')) {
      tasks.push(
        this.searchGitHub(query, dto.maxResultsPerSource || 5).then((gh) => {
          if (gh && gh.repositories.length > 0) {
            sourcesUsed.add('GitHub');
            gh.repositories.forEach((repo, idx) => {
              citations.push({
                id: `gh-${idx + 1}`,
                title: repo.fullName,
                url: repo.url,
                snippet: repo.description || `GitHub repository by ${repo.owner} (${repo.language || 'Unknown language'})`,
                source: 'GitHub',
                metadata: {
                  stars: repo.stars,
                  forks: repo.forks,
                  language: repo.language,
                  owner: repo.owner,
                },
              });
            });
          }
        }),
      );
    }

    if (sourcesToQuery.includes('arxiv')) {
      tasks.push(
        this.searchArXiv(query, dto.maxResultsPerSource || 5).then((ar) => {
          if (ar && ar.papers.length > 0) {
            sourcesUsed.add('arXiv');
            ar.papers.forEach((paper, idx) => {
              citations.push({
                id: `arxiv-${idx + 1}`,
                title: paper.title,
                url: paper.url,
                snippet: paper.summary,
                source: 'arXiv',
                author: paper.authors.join(', '),
                publishedDate: paper.published,
                metadata: { pdfUrl: paper.pdfUrl },
              });
            });
          }
        }),
      );
    }

    if (sourcesToQuery.includes('duckduckgo')) {
      tasks.push(
        this.searchDuckDuckGo(query).then((ddgCards) => {
          if (ddgCards.length > 0) {
            sourcesUsed.add('DuckDuckGo');
            citations.push(...ddgCards);
          }
        }),
      );
    }

    if (sourcesToQuery.includes('news')) {
      tasks.push(
        this.searchNews(query, dto.maxResultsPerSource || 5).then((newsCards) => {
          if (newsCards.length > 0) {
            sourcesUsed.add('News');
            citations.push(...newsCards);
          }
        }),
      );
    }

    // Await all parallel tasks
    await Promise.allSettled(tasks);

    // 3. Deduplicate citations by URL and assign 1-indexed IDs for clean AI citations
    const seenUrls = new Set<string>();
    const cleanCitations: CitationCard[] = [];

    for (const card of citations) {
      if (!seenUrls.has(card.url)) {
        seenUrls.add(card.url);
        cleanCitations.push({
          ...card,
          id: `${cleanCitations.length + 1}`,
        });
      }
    }

    // 4. AI-Powered Synthesis
    let summary: string | undefined = undefined;

    if (dto.synthesize !== false && cleanCitations.length > 0) {
      try {
        const citationsText = cleanCitations
          .map(
            (c) =>
              `[${c.id}] "${c.title}" (${c.source}): ${c.snippet}\nLink: ${c.url}`,
          )
          .join('\n\n');

        const systemPrompt = `You are JARVIS, an advanced personal AI assistant and research intelligence system.
Your mission is to synthesize the user's research query using the provided verified citation sources.
Guidelines:
- Reference sources strictly with bracketed indices like [1], [2] matching the citation cards.
- Provide a clear, insightful, well-structured synthesis with markdown formatting (bullet points, bold text).
- If the sources provide specific data (weather degrees, prices, paper conclusions), state them accurately.
- Keep the response objective, concise, and helpful.`;

        const aiResponse = await this.aiGateway.generate(
          {
            model: dto.model || 'auto',
            messages: [
              {
                role: 'user',
                content: `Research Query: "${query}"\n\nVerified Sources:\n${citationsText}\n\nPlease synthesize these findings to answer my query thoroughly.`,
              },
            ],
            systemPrompt,
            temperature: 0.2,
          },
          userId,
        );

        summary = aiResponse.content;
      } catch (aiErr) {
        this.logger.warn(`AI synthesis failed, creating structured summary: ${aiErr}`);
        summary = this.createFallbackSummary(query, cleanCitations);
      }
    } else if (cleanCitations.length === 0) {
      summary = `No verified public sources returned direct matches for "${query}". Try refining your search query or selecting specific sources like Wikipedia, GitHub, or arXiv.`;
    }

    const latencyMs = Date.now() - startTime;

    return {
      query,
      summary,
      citations: cleanCitations,
      sourcesUsed: Array.from(sourcesUsed),
      executedAt: new Date().toISOString(),
      latencyMs,
    };
  }

  private detectSources(query: string): SearchSource[] {
    const q = query.toLowerCase();
    const detected: SearchSource[] = [];

    if (
      q.includes('weather') ||
      q.includes('temperature') ||
      q.includes('forecast') ||
      q.includes('rain') ||
      q.includes('humidity') ||
      q.includes('climate')
    ) {
      detected.push('openmeteo');
    }

    if (
      q.includes('crypto') ||
      q.includes('bitcoin') ||
      q.includes('btc') ||
      q.includes('ethereum') ||
      q.includes('eth') ||
      q.includes('solana') ||
      q.includes('coin') ||
      q.includes('price of')
    ) {
      detected.push('coingecko');
    }

    if (
      q.includes('github') ||
      q.includes('repo') ||
      q.includes('code') ||
      q.includes('library') ||
      q.includes('framework') ||
      q.includes('npm') ||
      q.includes('open source')
    ) {
      detected.push('github');
    }

    if (
      q.includes('paper') ||
      q.includes('arxiv') ||
      q.includes('research') ||
      q.includes('study') ||
      q.includes('quantum') ||
      q.includes('deep learning') ||
      q.includes('physics')
    ) {
      detected.push('arxiv');
    }

    if (q.includes('news') || q.includes('latest') || q.includes('today')) {
      detected.push('news');
    }

    // Default fallbacks: always check Wikipedia and DuckDuckGo for general factual depth
    if (!detected.includes('wikipedia')) detected.push('wikipedia');
    if (!detected.includes('duckduckgo')) detected.push('duckduckgo');

    return detected;
  }

  private extractLocationFromQuery(query: string): string {
    const clean = query.replace(/(what's the|what is the|how is the|weather in|weather for|forecast in|forecast for)/gi, '').trim();
    return clean || 'London';
  }

  private extractCoinFromQuery(query: string): string {
    const clean = query
      .replace(/(what is the price of|price of|crypto|coin|value of|how much is)/gi, '')
      .trim()
      .split(' ')[0];
    return clean || 'bitcoin';
  }

  private createFallbackSummary(query: string, citations: CitationCard[]): string {
    const items = citations
      .map((c) => `- **[${c.id}] ${c.title}** (${c.source}): ${c.snippet}`)
      .join('\n');
    return `### Research Findings for "${query}"\n\n${items}`;
  }
}
