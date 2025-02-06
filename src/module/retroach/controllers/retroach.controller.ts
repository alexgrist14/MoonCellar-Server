import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RetroachievementsService } from '../services/retroach.service';
import { RAGame } from '../schemas/retroach.schema';

@ApiTags('RAGames')
@Controller('ra-games')
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}
  @Get('/platform/:id')
  @ApiOperation({ summary: 'Get all games by console ID' })
  @ApiResponse({
    status: 200,
    description: 'Games received successfully',
  })
  getGamesByPlatform(
    @Param('id') id: string,
    @Query('onlyWithAchievements') onlyWithAchievements?: boolean,
    @Query('withoutSubsets') withoutSubsets?: boolean,
  ): Promise<RAGame[]> {
    return this.retroachievementsService.findGamesByPlatform(
      id,
      String(onlyWithAchievements),
      String(withoutSubsets),
    );
  }
  @Get('/all')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({
    status: 200,
    description: 'Games received successfully',
  })
  getAllGames(): Promise<RAGame[]> {
    return this.retroachievementsService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get game by ID' })
  @ApiResponse({
    status: 200,
    description: 'Game received successfully',
  })
  getById(@Param('id') id: string): Promise<RAGame> {
    return this.retroachievementsService.findGameById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get random games for given platforms' })
  @ApiResponse({
    status: 200,
    description: 'Random games received successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect platform identifiers',
  })
  async getRandomGamesByPlatforms(
    @Query('platformIds') platformIds: string[],
    @Query('onlyWithAchievements') isOnlyWithAchievements?: boolean,
    @Query('withoutSubsets') isWithoutSubsets?: boolean,
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
