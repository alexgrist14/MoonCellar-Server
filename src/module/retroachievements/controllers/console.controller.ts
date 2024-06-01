import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RetroachievementsService } from '../retroach.service';

@ApiTags('RAconsoles')
@Controller('ra-consoles')
export class RAConsolesController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService,
  ) {}

  @Get()
  async getConsoleIds() {
    return this.retroachievementsService.findConsolesIds();
  }
}
