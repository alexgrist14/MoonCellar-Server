import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConsoleService } from '../services/console.service';

@ApiTags('RAconsoles')
@Controller('ra-consoles')
export class RAConsolesController {
  constructor(private readonly consoleService: ConsoleService) {}

  @Get()
  async getAllConsoles() {
    return this.consoleService.findAll();
  }
}
