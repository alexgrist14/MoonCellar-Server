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
import { categories, categoriesType, ILogs } from '../types/actions';
import mongoose from 'mongoose';
import { gamesLookup } from 'src/shared/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(IGDBGames.name) private gameModel: Model<IGDBGamesDocument>,
  ) {}

  private userAndCategoryCheck(user: User, category: categoriesType) {
    if (!user) throw new NotFoundException('User not found');

    if (!categories.includes(category))
      throw new BadRequestException('Invalid category');
  }

  async addGameToCategory(
    userId: string,
    gameId: number,
    category: categoriesType,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    this.userAndCategoryCheck(user, category);

    if (!user.games[category].includes(gameId)) {
      const gameExists = await this.gameModel.exists({ _id: gameId });

      if (!gameExists) throw new NotFoundException('Game not found');

      user.games[category].push(gameId);

      for (const cat of categories) {
        if (cat !== category && user.games[cat]?.includes(gameId)) {
          user.games[cat] = user.games[cat]?.filter(
            (id: number) => id !== Number(gameId),
          );
        }
      }
    } else {
      throw new BadRequestException(`Game already in ${category} category`);
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
    category: categoriesType,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    this.userAndCategoryCheck(user, category);

    if (!user.games[category].includes(gameId))
      throw new NotFoundException(`Game not found in ${category} category`);

    user.games[category] = user.games[category].filter(
      (id: number) => id !== Number(gameId),
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
      (gameRating) => gameRating.game !== Number(gameId),
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

  async getUserGames(userId: string) {
    return (
      await this.userModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.completed',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.completed',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.playing',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.playing',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.wishlist',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.wishlist',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.backlog',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.backlog',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.dropped',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.dropped',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.mastered',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.mastered',
          },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: 'games.played',
            foreignField: '_id',
            pipeline: [...gamesLookup(true)],
            as: 'games.played',
          },
        },
        { $project: { games: 1 } },
      ])
    ).pop();
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

  async addUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException('User not found');
    if (user.followings.includes(new mongoose.Types.ObjectId(followingId)))
      throw new BadRequestException(`User already in following list`);

    user.followings.push(new mongoose.Types.ObjectId(followingId));
    await user.save();
    return user;
  }

  async removeUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException('User not found');

    user.followings = user.followings.filter(
      (user) => user.toString() !== followingId,
    );
    await user.save();
    return user;
  }

  async getUserFollowings(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return (
      await this.userModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'followings',
            foreignField: '_id',
            as: 'followings',
          },
        },
        {
          $project: {
            followings: {
              $map: {
                input: '$followings',
                as: 'following',
                in: {
                  userId: '$$following._id',
                  userName: '$$following.userName',
                  profilePicture: '$$following.profilePicture',
                },
              },
            },
          },
        },
      ])
    ).pop();
  }
}
