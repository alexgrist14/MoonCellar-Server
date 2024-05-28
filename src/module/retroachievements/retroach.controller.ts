import { Controller, Get, Param } from '@nestjs/common';
import { RetroachievementsService } from './retroach.service';
import { RAGame } from './schemas/retroach.schema';

@Controller('retroachievements')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get('/:id')
  getGamesByPlatform(@Param('id') id: number): Promise<RAGame[]> {
    return this.retroachievementsService.findGamesByPlatform(id);
  }
  @Get()
  getAllGames(): Promise<RAGame[]> {
    return this.retroachievementsService.findAll();
  }
}
