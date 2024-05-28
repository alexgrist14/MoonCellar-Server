import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async addGame(userId: string, gameId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    const gameObjectId = new Types.ObjectId(gameId);

    if (!user.games.includes(gameObjectId)) {
      user.games.push(gameObjectId);
      await user.save();
    }

    return user;
  }
}
