import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RetroachievementsService } from '../services/retroach.service';

@ApiTags('RetroAchievements')
@Controller('/parse')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Parse from RA' })
  @ApiResponse({
    status: 200,
    description: 'Successfully started',
  })
  @ApiQuery({ name: 'type', enum: ['consoles', 'games', 'both'] })
  parse(@Query('type') type: 'consoles' | 'games' | 'both') {
    return this.retroachievementsService.parse(type);
  }
}
