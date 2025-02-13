import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGDBService } from '../igdb.service';
import { categories as gameCategories } from '../constants/common';

@ApiTags('IGDB')
@Controller('igdb')
export class IgdbController {
  constructor(private readonly service: IGDBService) {}

  @Get('/games')
  @ApiOperation({ summary: 'Get games' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  @ApiQuery({ name: 'isRandom', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Work only with isRandom = false',
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'votes', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['any', 'all'] })
  @ApiQuery({ name: 'selected', required: false })
  @ApiQuery({ name: 'excluded', required: false })
  @ApiQuery({ name: 'years', required: false })
  @ApiQuery({ name: 'categories', required: false })
  @ApiQuery({ name: 'company', required: false })
  @ApiQuery({ name: 'excludeGames', required: false })
  getGames(
    @Query('take') take: number,
    @Query('page') page: number,
    @Query('isRandom') isRandom: boolean,
    @Query('isOnlyWithAchievements') isOnlyWithAchievements: boolean,
    @Query('selected') selected: string,
    @Query('excluded') excluded: string,
    @Query('rating') rating: number,
    @Query('votes') votes: string,
    @Query('search') search: string,
    @Query('company') company: string,
    @Query('excludeGames') excludeGames: number[],
    @Query('years') years: [number, number],
    @Query('categories') categories: (keyof typeof gameCategories)[],
    @Query('mode') mode: 'any' | 'all',
  ) {
    const games = this.service.getGames({
      take,
      page,
      isRandom,
      selected: selected?.includes('{') ? JSON.parse(selected) : undefined,
      excluded: excluded?.includes('{') ? JSON.parse(excluded) : undefined,
      rating,
      search,
      mode,
      categories,
      company,
      years,
      excludeGames,
      votes,
      isOnlyWithAchievements,
    });

    return games;
  }

  @Get('/genres')
  @ApiOperation({ summary: 'Get genres' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  genres() {
    return this.service.getGenres();
  }

  @Get('/platforms')
  @ApiOperation({ summary: 'Get platforms' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  platforms() {
    return this.service.getPlatforms();
  }

  @Get('/themes')
  @ApiOperation({ summary: 'Get themes' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  themes() {
    return this.service.getThemes();
  }

  @Get('/keywords')
  @ApiOperation({ summary: 'Get keywords' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  @ApiQuery({ name: 'query', required: false })
  keywords(@Query('query') query: string) {
    return this.service.getKeywords(query);
  }

  @Get('/keywords/by-id')
  @ApiOperation({ summary: 'Get keywords' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  @ApiQuery({ name: 'ids', required: false })
  keywordsById(@Query('ids') ids: number[]) {
    return this.service.getKeywordsByIds(ids);
  }

  @Get('/modes')
  @ApiOperation({ summary: 'Get game modes' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  modes() {
    return this.service.getGameModes();
  }

  @Get('/screenshot/:id')
  @ApiOperation({ summary: 'Get game artwork or screenshot' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  screenshot(@Param('id') id: number) {
    return this.service.getScreenshot(id);
  }

  @Get('/artwork/:id')
  @ApiOperation({ summary: 'Get game artwork or screenshot' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  artwork(@Param('id') id: number) {
    return this.service.getArtwork(id);
  }

  @Get('/by-id/:id')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  getGameById(@Param('id') id: string) {
    return this.service.getGameById(id);
  }

  @Get('/by-slug/:slug')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  getGameBySlug(@Param('slug') slug: string) {
    return this.service.getGameBySlug(slug);
  }

  @Get('/test')
  @ApiOperation({ summary: 'test' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  test() {
    return this.service.testFunction();
  }
}
