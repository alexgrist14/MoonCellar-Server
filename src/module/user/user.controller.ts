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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateEmailDto } from '../auth/dto/update-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}
  @Patch(':id/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Добавить игру в категорию' })
  @ApiResponse({
    status: 200,
    description: 'Игра успешно добавлена в категорию.',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректная категория или игра уже в категории.',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или игра не найдены.',
  })
  @HttpCode(HttpStatus.OK)
  async addGameToCaregory(
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
  @ApiOperation({ summary: 'Удалить игру из категории' })
  @ApiResponse({
    status: 200,
    description: 'Игра успешно удалена из категории.',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректная категория или игра отсутствует в категории.',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или игра не найдены.',
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

  @Get(':id')
  @ApiOperation({ summary: 'Получение юзера по id' })
  @ApiResponse({
    status: 200,
    description: 'Юзер успешно получен',
  })
  async findById(@Param('id') userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получение всех юзеров' })
  @ApiResponse({
    status: 200,
    description: 'Юзеры успешно получены',
  })
  async getAllBooks(@Query() query: ExpressQuery): Promise<User[]> {
    return this.usersService.findAll(query);
  }

  @Patch(':id/email')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление email пользователя' })
  @ApiResponse({ status: 200, description: 'Email обновлён успешно' })
  async updateEmail(
    @Param('id') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
    @Req() req,
  ): Promise<User> {
    console.log(req.user._id);
    console.log(userId);

    return this.usersService.updateEmail(userId, updateEmailDto);
  }

  @Patch(':id/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление пароля пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно обновлён' })
  async updatePassword(
    @Param('id') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req,
  ): Promise<User> {
    if (req.user._id !== userId) {
      throw new UnauthorizedException('You can only update your own password');
    }
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }
}
