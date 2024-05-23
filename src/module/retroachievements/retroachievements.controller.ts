import { Controller, Get, Param } from '@nestjs/common';
import { RetroachievementsService } from './retroachievements.service';

@Controller('retroachievements')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get(':id')
  getGamesByPlatform(@Param('id') id: string): Promise<string> {
    return this.retroachievementsService.getGamesByPlatform(id);
  }
}
