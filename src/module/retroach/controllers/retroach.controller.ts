import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RetroachievementsService } from '../services/retroach.service';

@ApiTags('RetroAchievements')
@Controller('/ra-parse')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}

  @Post('/parse')
  @ApiOperation({ summary: 'Parse from RA' })
  @ApiResponse({
    status: 200,
    description: 'Successfully started',
  })
  @ApiQuery({ name: 'type', enum: ['consoles', 'games', 'both'] })
  parse(@Query('type') type: 'consoles' | 'games' | 'both') {
    return this.retroachievementsService.parse(type);
  }

  @Post('/sync')
  @ApiOperation({ summary: 'Sync RA ids to IGDB games' })
  @ApiResponse({ status: 200, description: 'Successfully started' })
  raParse() {
    return this.retroachievementsService.parseRAGames();
  }

  @Post('/unrecognised')
  @ApiOperation({ summary: 'Get unrecognised RA games' })
  @ApiResponse({ status: 200, description: 'Successfully started' })
  raUnrecognised() {
    return this.retroachievementsService.getUnrecognised();
  }
}
