import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Query as ExpressQuery } from 'express-serve-static-core';
import mongoose, { Model } from 'mongoose';
import { UpdateEmailDto } from 'src/module/auth/dto/update-email.dto';
import { UpdatePasswordDto } from 'src/module/auth/dto/update-password.dto';
import { User } from 'src/module/auth/schemas/user.schema';
import {
  IGDBGames,
  IGDBGamesDocument,
} from 'src/shared/schemas/igdb-games.schema';
import { gamesLookup } from 'src/shared/utils';
import { categories, categoriesType, IUserLogs } from '../types/actions';

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

  async getUserLogs(userId: string) {
    return (await this.userModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: {
          logs: { $slice: ['$logs', -50] },
        },
      },
      {
        $unwind: '$logs',
      },
      {
        $lookup: {
          from: 'igdbgames',
          localField: 'logs.gameId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1,
                slug: 1,
                cover: 1,
              },
            },
            {
              $lookup: {
                from: 'igdbcovers',
                localField: 'cover',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: { url: 1, _id: 0 },
                  },
                ],
                as: 'cover',
              },
            },
            { $unwind: '$cover' },
          ],
          as: 'logs.game',
        },
      },
      {
        $unwind: '$logs.game',
      },
      {
        $group: {
          _id: '$_id',
          logs: { $push: '$logs' },
        },
      },
    ])) as IUserLogs[];
  }

  async findById(userId: string): Promise<User> {
    return await this.userModel.findById(userId).select([
      '-password',
      '-logs',
      '-createdAt',
      '-updatedAt',
      '-refreshToken',
      '-__v',
    ]);;
  }

  async getUserGamesLength(userId: string, ){
    const user = await this.userModel.findById(userId);
    const gamesLength = {};

    categories.forEach((cat)=>{
      gamesLength[cat]= user.games[cat].length;
    });

    return gamesLength;

  }

  async getUserGames(userId: string, category: categoriesType) {
    return (
      await this.userModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) },
        },
        {
          $lookup: {
            from: 'igdbgames',
            localField: `games.${category}`,
            foreignField: '_id',
            let: { ids: `$games.${category}` },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$ids'] },
                },
              },
              {
                $addFields: {
                  sort: {
                    $indexOfArray: ['$$ids', '$_id'],
                  },
                },
              },
              { $sort: { sort: -1 } },
              { $addFields: { sort: '$$REMOVE' } },
              ...gamesLookup(true),
            ],
            as: `games.${category}`,
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
                  _id: '$$following._id',
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
