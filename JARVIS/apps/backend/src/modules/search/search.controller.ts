import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('research')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Post('search')
  async unifiedResearch(
    @Body() dto: SearchQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    if (!dto.query || !dto.query.trim()) {
      throw new BadRequestException('Search query cannot be empty.');
    }
    return this.searchService.unifiedResearch(dto, userId);
  }

  @Public()
  @Get('weather')
  async getWeather(@Query('location') location?: string) {
    if (!location) {
      throw new BadRequestException('Query parameter "location" is required.');
    }
    const result = await this.searchService.getWeather(location);
    if (!result) {
      throw new NotFoundException(`Weather data not found for location "${location}".`);
    }
    return result;
  }

  @Public()
  @Get('crypto')
  async getCrypto(
    @Query('coin') coin?: string,
    @Query('currency') currency: string = 'usd',
  ) {
    if (!coin) {
      throw new BadRequestException('Query parameter "coin" is required.');
    }
    const result = await this.searchService.getCryptoPrice(coin, currency);
    if (!result) {
      throw new NotFoundException(`Crypto price not found for "${coin}".`);
    }
    return result;
  }

  @Public()
  @Get('wiki')
  async getWikipedia(@Query('query') query?: string) {
    if (!query) {
      throw new BadRequestException('Query parameter "query" is required.');
    }
    const result = await this.searchService.searchWikipedia(query);
    if (!result) {
      throw new NotFoundException(`Wikipedia article not found for "${query}".`);
    }
    return result;
  }

  @Public()
  @Get('github')
  async getGitHub(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter "query" is required.');
    }
    const numLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20) : 5;
    const result = await this.searchService.searchGitHub(query, numLimit);
    if (!result) {
      throw new NotFoundException(`No GitHub repositories found for "${query}".`);
    }
    return result;
  }

  @Public()
  @Get('arxiv')
  async getArXiv(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter "query" is required.');
    }
    const numLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20) : 5;
    const result = await this.searchService.searchArXiv(query, numLimit);
    if (!result) {
      throw new NotFoundException(`No arXiv papers found for "${query}".`);
    }
    return result;
  }

  @Public()
  @Get('news')
  async getNews(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter "query" is required.');
    }
    const numLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20) : 5;
    return this.searchService.searchNews(query, numLimit);
  }

  @Public()
  @Get('sources')
  getSupportedSources() {
    return [
      {
        id: 'wikipedia',
        name: 'Wikipedia REST',
        description: 'Comprehensive encyclopedia summaries, references and definitions.',
        freeTier: '100% Free, No Key',
      },
      {
        id: 'openmeteo',
        name: 'Open-Meteo',
        description: 'Global weather forecast, temperature, humidity, and atmospheric conditions.',
        freeTier: '100% Free, No Key',
      },
      {
        id: 'coingecko',
        name: 'CoinGecko',
        description: 'Live cryptocurrency prices, 24h market trends, and ticker data.',
        freeTier: 'Free Tier, No Key',
      },
      {
        id: 'github',
        name: 'GitHub API',
        description: 'Public open-source repository search, stars, forks, and licenses.',
        freeTier: 'Free Tier (60 req/hr unauthenticated)',
      },
      {
        id: 'arxiv',
        name: 'arXiv.org',
        description: 'Scientific and academic research papers, authors, abstracts, and PDFs.',
        freeTier: '100% Free, Open Access',
      },
      {
        id: 'duckduckgo',
        name: 'DuckDuckGo Instant',
        description: 'Instant web knowledge answers and related topical queries.',
        freeTier: '100% Free, No Key',
      },
      {
        id: 'news',
        name: 'Tech & World News',
        description: 'Curated trending discussions, news releases, and Hacker News articles.',
        freeTier: '100% Free, No Key',
      },
    ];
  }
}
