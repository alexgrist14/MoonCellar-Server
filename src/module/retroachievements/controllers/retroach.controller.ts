import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { RetroachievementsService } from '../retroach.service';
import { RAGame } from '../schemas/retroach.schema';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('retroarch')
@Controller('retrogames')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get('/platform/:id')
  @ApiOperation({ summary: 'Получение всех игр по id консоли' })
  @ApiResponse({
    status: 200,
    description: 'Игры успешно получены',
  })
  getGamesByPlatform(
    @Param('id') id: number,
    @Body() onlyWithAchievements: boolean,
  ): Promise<RAGame[]> {
    return this.retroachievementsService.findGamesByPlatform(
      id,
      onlyWithAchievements,
    );
  }
  // @Get()
  // @ApiOperation({ summary: 'Получение всех игр' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Игры успешно получены',
  // })
  // getAllGames(): Promise<RAGame[]> {
  //   return this.retroachievementsService.findAll();
  // }

  @Get('/:id')
  @ApiOperation({ summary: 'Получение игры по id' })
  @ApiResponse({
    status: 200,
    description: 'Игра успешно получена',
  })
  getById(@Param('id') id: string): Promise<RAGame> {
    return this.retroachievementsService.findGameById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить случайные игры для заданных платформ' })
  @ApiResponse({ status: 200, description: 'Случайные игры успешно получены' })
  @ApiResponse({
    status: 400,
    description: 'Некорректные идентификаторы платформ',
  })
  async getRandomGamesByPlatforms(
    @Query('platformIds') platformIds: string,
    @Query('onlyWithAchievements') onlyWithAchievements: boolean,
  ): Promise<{ [key: number]: RAGame[] }> {
    if (!platformIds) {
      throw new BadRequestException('Platform IDs are required');
    }

    const platformIdsArray = platformIds
      .split(',')
      .map((id) => parseInt(id, 10));
    if (platformIdsArray.some(isNaN)) {
      throw new BadRequestException('Invalid platform IDs');
    }

    return this.retroachievementsService.findRandomGamesByPlatforms(
      platformIdsArray,
      onlyWithAchievements,
    );
  }
}
