import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateEmailDto } from '../auth/dto/update-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import * as bcrypt from 'bcryptjs';
import { RAGame } from '../retroachievements/schemas/retroach.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RAGame.name) private gameModel: mongoose.Model<RAGame>,
  ) {}

  private userAndCategoryCheck(user: User, category: string) {
    if (!user) throw new NotFoundException('User not found');

    if (!['completed', 'wishlist', 'playing', 'dropped'].includes(category))
      throw new BadRequestException('Invalid caregory');
  }

  async addGameToCategory(
    userId: string,
    gameId: string,
    category: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    this.userAndCategoryCheck(user, category);

    const gameExists = await this.gameModel.exists({ _id: gameId });

    if (!gameExists) throw new NotFoundException('Game not found');

    if (user.games[category].includes(gameId))
      throw new BadRequestException(`Game already in ${category} category`);

    for (const cat of ['completed', 'wishlist', 'playing', 'dropped']) {
      if (cat !== category && user.games[cat].includes(gameId)) {
        user.games[cat] = user.games[cat].filter((id) => id !== gameId);
      }
    }

    if (!user.games[category].includes(gameId)) {
      user.games[category].push(gameId);
    }

    await user.save();
    return user;
  }

  async removeGameFromCategory(
    userId: string,
    gameId: string,
    category: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    this.userAndCategoryCheck(user, category);

    if (!user.games[category].includes(gameId))
      throw new NotFoundException(`Game not found in ${category} category`);

    user.games[category] = user.games[category].filter((id) => id !== gameId);
    await user.save();
    return user;
  }

  async findById(userId: string): Promise<User> {
    return await this.userModel.findById(userId);
  }

  async findAll(query: ExpressQuery): Promise<User[]> {
    const resPerPage = 2;
    const currentPage = +query.page || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return users;
  }

  async updateEmail(
    userId: string,
    UpdateEmailDto: UpdateEmailDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    user.email = UpdateEmailDto.newEmail;
    await user.save();
    return user;
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  }
}
