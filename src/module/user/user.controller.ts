import {
  Controller,
  Param,
  Post,
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

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}
  @Post(':id/games/:gameId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Добавление игры пользователю' })
  @ApiResponse({
    status: 201,
    description: 'Игра успешно добавлена пользователю.',
  })
  async addGame(
    @Param('id') userId: string,
    @Param('gameId') gameId: string,
    @Req() req,
  ): Promise<User> {
    if (req.user._id !== userId) {
      throw new UnauthorizedException(
        'You can only add games to your own profile',
      );
    }
    return this.usersService.addGame(userId, gameId);
  }
}
