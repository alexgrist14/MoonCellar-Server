import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateEmailDto } from '../auth/dto/update-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import { User } from '../auth/schemas/user.schema';
import { AddGameRatingDto } from './dto/add-game-rating.dto';
import { FileUploadService } from './services/file-upload.service';
import { UserService } from './services/user.service';
import { categories, categoriesType } from './types/actions';
import { UserFiltersService } from './services/user-filters.service';
import { FilterDto } from './dto/filters.dto';
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { UserIdGuard } from '../auth/user.gurard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly fileUploadService: FileUploadService,
    private readonly userFiltersService: UserFiltersService,
  ) {}
  @Patch(':userId/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiQuery({ name: 'category', enum: categories })
  @HttpCode(HttpStatus.OK)
  async addGameToCategory(
    @Param('userId') userId: string,
    @Param('gameId') gameId: number,
    @Query('category') category: categoriesType,
  ) {
    return this.usersService.addGameToCategory(userId, gameId, category);
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
    return this.usersService.removeGameFromCategory(userId, gameId, category);
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
    return this.usersService.addGameRating(
      userId,
      gameRatingDto.game,
      gameRatingDto.rating,
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
    return this.usersService.removeGameRating(userId, gameId);
  }

  @Get('name')
  @ApiOperation({ summary: 'Get user by name' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiQuery({ name: 'name' })
  findByName(@Query('name') query: string): Promise<User> {
    return this.usersService.findByString(query, 'userName');
  }

  @Get('email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiQuery({ name: 'email' })
  findByEmail(@Query('email') query: string): Promise<User> {
    return this.usersService.findByString(query, 'email');
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async findById(@Param('userId') userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get('/logs/:userId')
  @ApiOperation({ summary: 'Get user logs' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getUserLogs(@Param('userId') userId: string) {
    return this.usersService.getUserLogs(userId);
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
    return this.usersService.getUserGames(userId, category);
  }

  @Get('/games/length/:userId')
  @ApiOperation({ summary: 'Get user games length' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getUserGamesLength(@Param('userId') userId: string) {
    return this.usersService.getUserGamesLength(userId);
  }

  @Get('/followings/:userId')
  @ApiOperation({ summary: 'Get user followings' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getUserFollowings(@Param('userId') userId: string) {
    return this.usersService.getUserFollowings(userId);
  }

  @Patch('/followings/:userId/:followingId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Add following to user' })
  @ApiResponse({ status: 200, description: 'success' })
  async addUserFollowing(
    @Param('userId') userId: string,
    @Param('followingId') followingId: string,
  ) {
    return this.usersService.addUserFollowing(userId, followingId);
  }

  @Delete('/followings/:userId/:followingId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Remove user following' })
  @ApiResponse({ status: 200, description: 'success' })
  async removeUserFollowing(
    @Param('userId') userId: string,
    @Param('followingId') followingId: string,
  ) {
    return this.usersService.removeUserFollowing(userId, followingId);
  }

  @Patch('email/:userId')
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user email' })
  @ApiResponse({ status: 200, description: 'success' })
  async updateEmail(
    @Param('userId') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<User> {
    return this.usersService.updateEmail(userId, updateEmailDto);
  }

  @Patch('password/:userId')
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updatePassword(
    @Param('userId') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req,
  ): Promise<User> {
    if (req.user._id.toString() !== userId) {
      throw new UnauthorizedException('You can only update your own password');
    }
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }

  @Post('profile-picture/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Add user profile picture' })
  @ApiResponse({ status: 201, description: 'picture name' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const prevPicture = await this.usersService.getProfilePicture(userId);

    if (prevPicture) await this.fileUploadService.deleteFile(prevPicture);

    const fileName = await this.fileUploadService.uploadFile(file);
    await this.usersService.updateProfilePicture(userId, fileName);

    return { profilePicture: fileName };
  }

  @Get('profile-picture/:userId')
  @ApiOperation({ summary: 'Get user profile picture' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getProfilePicture(@Param('userId') userId: string) {
    const fileName = await this.usersService.getProfilePicture(userId);

    if (!fileName) {
      throw new NotFoundException('Profile picture not found');
    }

    return { fileName };
  }

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

  @Patch('description/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserIdGuard)
  @ApiOperation({ summary: 'Update user description' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updateDescription(
    @Param('userId') userId: string,
    @Body() descriptionDto: UpdateDescriptionDto,
  ) {
    return await this.usersService.updateUserDescription(
      userId,
      descriptionDto.description,
    );
  }
}
