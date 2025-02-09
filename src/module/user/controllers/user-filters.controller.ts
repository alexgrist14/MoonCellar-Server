import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserFiltersService } from '../services/user-filters.service';
import { AuthGuard } from '@nestjs/passport';
import { UserIdGuard } from 'src/module/auth/user.guard';
import { FilterDto } from '../dto/filters.dto';

@ApiTags('User Filters')
@Controller('user')
export class UserFiltersController {
  constructor(private readonly userFiltersService: UserFiltersService) {}

  @Post('filters/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Save filter to user' })
  @ApiResponse({ status: 200, description: 'Success' })
  async addFilter(
    @Param('userId') userId: string,
    @Body() filterDto: FilterDto,
  ) {
    return await this.userFiltersService.addFilter(
      userId,
      filterDto.name,
      filterDto.filter,
    );
  }

  @Delete('filters/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Remove filter from user' })
  @ApiResponse({ status: 200, description: 'Success' })
  async deleteFilter(
    @Param('userId') userId: string,
    @Query('name') name: string,
  ) {
    return await this.userFiltersService.removeFilter(userId, name);
  }

  @Get('filters/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Get user filters' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getFilters(@Param('userId') userId: string) {
    return await this.userFiltersService.getFilters(userId);
  }
}
