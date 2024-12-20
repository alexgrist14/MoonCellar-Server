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
import { User } from '../auth/schemas/user.schema';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateEmailDto } from '../auth/dto/update-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import { UserService } from './services/user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './services/file-upload.service';
import { AddGameRatingDto } from './dto/add-game-rating.dto';
import { categories, categoriesType, ILogs } from './types/actions';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}
  @Patch(':userId/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  async getUserLogs(@Param('userId') userId: string): Promise<ILogs[]> {
    return this.usersService.getUserLogs(userId);
  }

  @Get('/games/:userId')
  @ApiOperation({ summary: 'Get user games' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getUserGames(@Param('userId') userId: string) {
    return this.usersService.getUserGames(userId);
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove user following' })
  @ApiResponse({ status: 200, description: 'success' })
  async removeUserFollowing(
    @Param('userId') userId: string,
    @Param('followingId') followingId: string,
  ) {
    return this.usersService.removeUserFollowing(userId, followingId);
  }

  @Patch('email/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user email' })
  @ApiResponse({ status: 200, description: 'success' })
  async updateEmail(
    @Param('userId') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
    @Req() req,
  ): Promise<User> {
    if (req.user._id.toString() !== userId) {
      throw new UnauthorizedException('You can only update your own email');
    }
    return this.usersService.updateEmail(userId, updateEmailDto);
  }

  @Patch('password/:userId')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
    const fileName = await this.fileUploadService.uploadFile(file);
    await this.usersService.updateProfilePicture(userId, fileName);
    //const prevPicture = await this.usersService.getProfilePicture(userId);

    //if (prevPicture) await this.fileUploadService.deleteFile(prevPicture);

    return { profilePicture: fileName };
  }

  @Get('profile-picture/:userId')
  @ApiOperation({ summary: 'Get user profile picture' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getProfilePicture(@Param('userId') userId: string) {
    const fileName = await this.usersService.getProfilePicture(userId);
    //const filePath = this.fileUploadService.getFilePath(fileName);

    if (!fileName) {
      throw new NotFoundException('Profile picture not found');
    }

    return { fileName };
  }
}
