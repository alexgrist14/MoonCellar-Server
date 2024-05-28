import {
  Controller,
  Param,
  Post,
  Req
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}
  @Post(':id/games/:gameId')
  async addGame(@Param('id') userId: string,
  @Param('gameId') gameId: string,
  @Req() req):Promise<User>{
    // if (req.user._id !== userId) {
    //   throw new UnauthorizedException('You can only add games to your own profile');
    // }
    return this.usersService.addGame(userId, gameId);
  }
}
