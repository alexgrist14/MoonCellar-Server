import {
  BadRequestException,
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
  Res,
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
import { Response } from 'express';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}
  @Patch(':id/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add game to category' })
  @ApiResponse({
    status: 200,
    description: 'Game added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect category or game already in category',
  })
  @ApiResponse({
    status: 404,
    description: 'User or game not found',
  })
  @HttpCode(HttpStatus.OK)
  async addGameToCategory(
    @Param('id') userId: string,
    @Param('gameId') gameId: string,
    @Query('category') category: string,
  ): Promise<{ message: string }> {
    try {
      await this.usersService.addGameToCategory(userId, gameId, category);
      return { message: `Game successfully added to ${category}` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;

      throw new BadRequestException('Failed to add game to category');
    }
  }

  @Delete(':id/games/:gameId')
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
  @HttpCode(HttpStatus.OK)
  async removeGameFromCategory(
    @Param('id') userId: string,
    @Param('gameId') gameId: string,
    @Query('category') category: string,
  ): Promise<{ message: string }> {
    try {
      await this.usersService.removeGameFromCategory(userId, gameId, category);
      return { message: `Game successfully removed from ${category}` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;

      throw new BadRequestException('Failed to remove game from category');
    }
  }

  @Get('name')
  @ApiOperation({summary: 'Get user by name'})
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiQuery({name: 'name'})
  findByName(@Query('name') query: string): Promise<User>{
    return this.usersService.findByString(query,"name");
  }

  @Get('email')
  @ApiOperation({summary: 'Get user by email'})
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiQuery({name: 'email'})
  findByEmail(@Query('email') query: string): Promise<User>{
    return this.usersService.findByString(query,"email");
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async findById(@Param('id') userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Users' })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })

  @Patch(':id/email')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user email' })
  @ApiResponse({ status: 200, description: 'success' })
  async updateEmail(
    @Param('id') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
    @Req() req,
  ): Promise<User> {
    if (req.user._id.toString() !== userId) {
      throw new UnauthorizedException('You can only update your own email');
    }
    return this.usersService.updateEmail(userId, updateEmailDto);
  }

  @Patch(':id/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updatePassword(
    @Param('id') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req,
  ): Promise<User> {
    console.log(req.user)
    if (req.user._id.toString() !== userId) {
      throw new UnauthorizedException('You can only update your own password');
    }
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }

  @Post(':id/profile-picture')
  //@UseGuards(AuthGuard('jwt'))
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
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileName = await this.fileUploadService.uploadFile(file);
    await this.usersService.updateProfilePicture(userId, fileName);

    return { profilePicture: fileName };
  }

  @Get(':id/profile-picture')
  @ApiOperation({ summary: 'Get user profile picture' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getProfilePicture(@Param('id') userId: string) {
    const fileName = await this.usersService.getProfilePicture(userId);
    //const filePath = this.fileUploadService.getFilePath(fileName);

    if (!fileName) {
      throw new NotFoundException('Profile picture not found');
    }

    return {fileName};
  }
}
