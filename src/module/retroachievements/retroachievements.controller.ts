import { Controller, Get, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { RetroachievementsService } from './retroachievements.service';
import { Game } from '../game/game.schema';

@Controller('retroachievements')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get('/:id')
  getGamesByPlatform(@Param('id',ParseIntPipe) id: number): Promise<Game[]> {
    return this.retroachievementsService.findGamesByPlatform(id);
  }
}
