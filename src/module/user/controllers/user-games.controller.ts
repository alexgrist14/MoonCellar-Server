import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserGamesService } from '../services/user-games.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserIdGuard } from 'src/module/auth/user.guard';
import { categories, categoriesType } from '../types/actions';
import { AddGameRatingDto } from '../dto/add-game-rating.dto';
import { Role } from 'src/module/roles/enums/role.enum';
import { Roles } from 'src/module/roles/roles.decorator';
import { RolesGuard } from 'src/module/roles/roles.guard';

@ApiTags('User Games')
@Controller('user')
export class UserGamesController {
  constructor(private readonly userGamesService: UserGamesService) {}
  @Patch(':userId/games/:gameId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add game to category' })
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiQuery({ name: 'category', enum: categories })
  @HttpCode(HttpStatus.OK)
  async addGameToCategory(
    @Param('userId') userId: string,
    @Param('gameId') gameId: number,
    @Query('category') category: categoriesType,
  ) {
    return this.userGamesService.addGameToCategory(userId, gameId, category);
  }

  @Delete(':userId/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Remove game from category' })
  @ApiResponse({
    status: 200,
    description: 'Removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect category or game is not in category',
  })
  @ApiResponse({
    status: 404,
    description: 'User or game not found',
  })
  @ApiQuery({ name: 'category', enum: categories })
  @HttpCode(HttpStatus.OK)
  async removeGameFromCategory(
    @Param('userId') userId: string,
    @Param('gameId') gameId: number,
    @Query('category') category: categoriesType,
  ) {
    return this.userGamesService.removeGameFromCategory(
      userId,
      gameId,
      category,
    );
  }

  @Delete('rating/:userId/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Remove user rating from game' })
  @ApiResponse({ status: 200, description: 'Rating removed successfully' })
  async removeGameRating(
    @Param('userId') userId: string,
    @Param('gameId') gameId: number,
  ) {
    return this.userGamesService.removeGameRating(userId, gameId);
  }

  @Patch('rating/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Add user rating to game' })
  @ApiResponse({ status: 200, description: 'Rating added successfully' })
  async addGameRating(
    @Param('userId') userId: string,
    @Body() gameRatingDto: AddGameRatingDto,
  ) {
    return this.userGamesService.addGameRating(
      userId,
      gameRatingDto.game,
      gameRatingDto.rating,
    );
  }


  @Get('/games/:userId')
  @ApiOperation({ summary: 'Get user games' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiQuery({ name: 'category', enum: categories })
  async getUserGames(
    @Param('userId') userId: string,
    @Query('category') category: categoriesType,
  ) {
    return this.userGamesService.getUserGames(userId, category);
  }

  @Get('/games/length/:userId')
  @ApiOperation({ summary: 'Get user games length' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getUserGamesLength(@Param('userId') userId: string) {
    return this.userGamesService.getUserGamesLength(userId);
  }
}
