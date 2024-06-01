import { Controller, Get, Param } from '@nestjs/common';
import { RetroachievementsService } from './retroach.service';
import { RAGame } from './schemas/retroach.schema';
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
  getGamesByPlatform(@Param('id') id: number): Promise<RAGame[]> {
    return this.retroachievementsService.findGamesByPlatform(id);
  }
  @Get()
  @ApiOperation({ summary: 'Получение всех игр' })
  @ApiResponse({
    status: 200,
    description: 'Игры успешно получены',
  })
  getAllGames(): Promise<RAGame[]> {
    return this.retroachievementsService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Получение игры по id' })
  @ApiResponse({
    status: 200,
    description: 'Игра успешно получена',
  })
  getById(@Param('id') id: string): Promise<RAGame> {
    return this.retroachievementsService.findGameById(id);
  }
}
