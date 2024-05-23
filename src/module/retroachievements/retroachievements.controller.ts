import { Controller, Get, Param } from '@nestjs/common';
import { RetroachievementsService } from './retroachievements.service';
import { Game } from '../game/game.schema';

@Controller('retroachievements')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get('/:id')
  getGamesByPlatform(@Param('id') id: string): Promise<Game[]> {
    return this.retroachievementsService.findGamesByPlatform(+id);
  }
}
