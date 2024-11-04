import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Query as ExpressQuery } from 'express-serve-static-core';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/module/auth/schemas/user.schema';
import { UpdatePasswordDto } from 'src/module/auth/dto/update-password.dto';
import { UpdateEmailDto } from 'src/module/auth/dto/update-email.dto';
import {
  IGDBGames,
  IGDBGamesDocument,
} from 'src/shared/schemas/igdb-games.schema';
import { ILogs } from '../types/actions';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(IGDBGames.name) private gameModel: Model<IGDBGamesDocument>,
  ) {}

  private userAndCategoryCheck(user: User, category: string) {
    if (!user) throw new NotFoundException('User not found');

    if (!['completed', 'wishlist', 'playing', 'dropped'].includes(category))
      throw new BadRequestException('Invalid category');
  }

  async addGameToCategory(
    userId: string,
    gameId: number,
    category: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    console.log(gameId);

    this.userAndCategoryCheck(user, category);

    const gameExists = await this.gameModel.exists({ _id: gameId });
    console.log(gameExists);

    if (!gameExists) throw new NotFoundException('Game not found');

    if (user.games[category].includes(gameId))
      throw new BadRequestException(`Game already in ${category} category`);

    for (const cat of ['completed', 'wishlist', 'playing', 'dropped']) {
      if (cat !== category && user.games[cat].includes(gameId)) {
        user.games[cat] = user.games[cat].filter((id: number) => id !== gameId);
      }
    }

    if (!user.games[category].includes(gameId)) {
      user.games[category].push(gameId);
    }

    user.logs.push({
      date: new Date(Date.now()),
      action: category,
      isAdd: true,
      gameId: gameId,
    });

    await user.save();
    return user;
  }

  async removeGameFromCategory(
    userId: string,
    gameId: number,
    category: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    this.userAndCategoryCheck(user, category);

    if (!user.games[category].includes(gameId))
      throw new NotFoundException(`Game not found in ${category} category`);

    user.games[category] = user.games[category].filter(
      (id: number) => id !== gameId,
    );

    user.logs.push({
      date: new Date(Date.now()),
      action: category,
      isAdd: false,
      gameId: gameId,
    });

    await user.save();

    return user;
  }

  async addGameRating(
    userId: string,
    gameId: number,
    rating: number,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    const existingRating = user.gamesRating.find(
      (gameRating) => gameRating.game === gameId,
    );
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      user.gamesRating.push({ game: gameId, rating: rating });
    }

    user.logs.push({
      date: new Date(Date.now()),
      action: 'rating',
      isAdd: true,
      rating: rating,
      gameId: gameId,
    });

    await user.save();

    return user;
  }

  async removeGameRating(userId: string, gameId: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    user.gamesRating = user.gamesRating.filter(
      (gameRating) => gameRating.game !== gameId,
    );

    user.logs.push({
      date: new Date(Date.now()),
      action: 'rating',
      isAdd: false,
      gameId: gameId,
    });

    await user.save();
    return user;
  }

  async getUserLogs(userId: string): Promise<ILogs[]> {
    const user = await this.userModel.findById(userId);
    return user.logs;
  }

  async findById(userId: string): Promise<User> {
    return await this.userModel.findById(userId).select(['-password', '-__v']);
  }

  async findByString(
    searchString: string,
    searchType: 'userName' | 'email',
  ): Promise<User> {
    return await this.userModel
      .findOne({ [searchType]: searchString })
      .select([
        '-password',
        '-games',
        '-createdAt',
        '-updatedAt',
        '-refreshToken',
        '-__v',
      ]);
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

    const isPasswordMatched = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordMatched)
      throw new UnauthorizedException('Password does not match');

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  }

  async updateProfilePicture(userId: string, fileName: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.profilePicture = fileName;
    return user.save();
  }

  async getProfilePicture(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.profilePicture)
      throw new NotFoundException('Profile picture not found');

    return user.profilePicture;
  }
}
