import {
  Controller,
  Get
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RAGame } from '../schemas/retroach.schema';
import { RetroachievementsService } from '../services/retroach.service';

@ApiTags('RAGames')
@Controller('ra-games')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({
    status: 200,
    description: 'Games received successfully',
  })
  getAllGames(): Promise<RAGame[]> {
    return this.retroachievementsService.findAll();
  }
}
