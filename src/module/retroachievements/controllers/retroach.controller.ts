import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { RetroachievementsService } from '../services/retroach.service';
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
    @Query('onlyWithAchievements') onlyWithAchievements: boolean,
    @Query('withoutSubsets') withoutSubsets: boolean,
  ): Promise<RAGame[]> {
    return this.retroachievementsService.findGamesByPlatform(
      id,
      onlyWithAchievements,
      withoutSubsets,
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
    @Query('platformIds') platformIds: string[],
    @Query('onlyWithAchievements') isOnlyWithAchievements: boolean,
    @Query('withoutSubsets') isWithoutSubsets: boolean,
  ): Promise<RAGame[]> {
    if (!platformIds) {
      throw new BadRequestException('Platform IDs are required');
    }

    return this.retroachievementsService.findRandomGamesByPlatforms(
      platformIds,
      String(isOnlyWithAchievements),
      String(isWithoutSubsets),
    );
  }
}
