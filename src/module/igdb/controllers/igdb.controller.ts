import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGDBService } from '../igdb.service';

@ApiTags('IGDB')
@Controller('igdb')
export class IgdbController {
  constructor(private readonly service: IGDBService) {}

  @Get('/games')
  @ApiOperation({ summary: 'Get games' })
  @ApiResponse({ status: 200, description: 'Get over here!' })
  @ApiQuery({ name: 'genres', required: false, isArray: true })
  @ApiQuery({ name: 'platforms', required: false, isArray: true })
  @ApiQuery({ name: 'game_modes', required: false, isArray: true })
  @ApiQuery({ name: 'isRandom', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Work only with isRandom = false',
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'search', required: false })
  getGames(
    @Query('take') take: number,
    @Query('page') page: number,
    @Query('isRandom') isRandom: boolean,
    @Query('genres') genres: string[],
    @Query('platforms') platforms: string[],
    @Query('game_modes') modes: string[],
    @Query('rating') rating: number,
    @Query('search') search: string,
  ) {
    return this.service.getGames({
      take,
      page,
      isRandom,
      genres,
      platforms,
      modes,
      rating,
      search,
    });
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
}
