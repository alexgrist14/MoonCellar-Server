import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConsoleService } from '../services/console.service';
import { RetroachievementsService } from '../services/retroach.service';

@ApiTags('RAconsoles')
@Controller('ra-consoles')
export class RAConsolesController {
  constructor(
    private readonly consoleService: ConsoleService,
    private readonly retroachService: RetroachievementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all RA consoles' })
  @ApiResponse({ status: 200, description: 'success' })
  async getAllConsoles() {
    return this.consoleService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Parse RA consoles and RA games' })
  @ApiResponse({ status: 200, description: 'Successfully parsed' })
  async parseAll() {
    return this.retroachService.parseConsolesAndGames();
  }
}
