import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGDBService } from '../igdb.service';
import { ParserType } from '../interface/common.interface';
import { parserTypes } from '../constants/common';

@ApiTags('IGDB Parser')
@Controller('igdb-parser')
export class IgdbParserController {
  constructor(private readonly service: IGDBService) {}

  @Post('/')
  @ApiOperation({ summary: 'Parse all IGDB databases' })
  @ApiResponse({ status: 200, description: 'Successfully started' })
  all() {
    return this.service.parseAll();
  }

  @Post('/:type')
  @ApiOperation({ summary: 'Parse Selected IGDB database' })
  @ApiResponse({ status: 200, description: 'Successfully started' })
  @ApiQuery({ name: 'type', enum: parserTypes })
  selected(@Query('type') type: ParserType) {
    return this.service.parseSelected(type);
  }
}
