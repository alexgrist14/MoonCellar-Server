import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGDBService } from '../igdb.service';

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
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['any', 'all'] })
  @ApiQuery({ name: 'selected', required: false })
  @ApiQuery({ name: 'excluded', required: false })
  getGames(
    @Query('take') take: number,
    @Query('page') page: number,
    @Query('isRandom') isRandom: boolean,
    @Query('selected') selected: string,
    @Query('excluded') excluded: string,
    @Query('rating') rating: number,
    @Query('search') search: string,
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

  @Get('/modes')
  @ApiOperation({ summary: 'Get game modes' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  modes() {
    return this.service.getGameModes();
  }

  @Get('/art/:id')
  @ApiOperation({ summary: 'Get game artwork or screenshot' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  art(@Param('id') id: number) {
    return this.service.getArt(id);
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
}
