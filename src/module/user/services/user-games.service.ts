import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/module/user/schemas/user.schema';
import {
  IGDBGames,
  IGDBGamesDocument,
} from 'src/shared/schemas/igdb-games.schema';
import { gamesLookup } from 'src/shared/utils';
import { categories, categoriesType } from '../types/actions';

@Injectable()
export class UserGamesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(IGDBGames.name) private gamesModel: Model<IGDBGamesDocument>,
  ) {}

  async addGameToCategory(
    userId: string,
    gameId: number,
    category: categoriesType,
  ): Promise<User> {
    const filterCategories = categories
      .filter((cat) => cat !== category)
      .reduce((res, category) => {
        res[`games.${category}`] = {
          $filter: {
            input: `$games.${category}`,
            as: 'gameId',
            cond: { $ne: ['$$gameId', Number(gameId)] },
          },
        };
        return res;
      }, {});

    if (!this.gamesModel.exists({ _id: gameId })) {
      throw new BadRequestException('Game not found!');
    }

    const user = await this.userModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        [`games.${category}`]: { $exists: true },
      },
      [
        {
          $set: {
            ...filterCategories,
            [`games.${category}`]: {
              $concatArrays: [`$games.${category}`, [Number(gameId)]],
            },
            logs: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $arrayElemAt: ["$logs.gameId", -1] }, Number(gameId)] },
                    { $eq: [{ $arrayElemAt: ["$logs.isAdd", -1] }, true] },
                  ]
                },
                then: {
                  $concatArrays: [
                    { $slice: ["$logs", { $subtract: [{ $size: "$logs" }, 1] }] },
                    [
                      {
                        date: new Date(Date.now()),
                        action: {
                          $cond: {
                            if: {
                              $regexMatch: {
                                input: { $arrayElemAt: ["$logs.action", -1] },
                                regex: /rating/
                              }
                            },
                            then: {
                              $concat: [
                                "rating and ",
                                category
                              ]
                            },
                            else: category
                          }
                        },
                        isAdd: true,
                        gameId: Number(gameId),
                        rating: { $ifNull: [{ $arrayElemAt: ["$logs.rating", -1] }, null] },
                      }
                    ]
                  ]
                },
                else: {
                  $concatArrays: [
                    "$logs",
                    [
                      {
                        date: new Date(Date.now()),
                        action: category,
                        isAdd: true,
                        gameId: Number(gameId),
                      }
                    ]
                  ]
                }
              }
            }
          }
        }
      ],
      { new: true },
    );

    if (!user) {
      throw new BadRequestException('User or category not found!');
    }

    return user;
  }

  async removeGameFromCategory(
    userId: string,
    gameId: number,
    category: categoriesType,
  ): Promise<User> {
    const user = this.userModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        [`games.${category}`]: { $exists: true },
      },
      [
        {
          $set: {
            [`games.${category}`]: {
              $filter: {
                input: `$games.${category}`,
                as: 'gameId',
                cond: { $ne: ['$$gameId', Number(gameId)] },
              },
            },
            logs: {
              $concatArrays: [
                `$logs`,
                [
                  {
                    date: new Date(Date.now()),
                    action: category,
                    isAdd: false,
                    gameId: Number(gameId),
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true },
    );

    if (!user) {
      throw new BadRequestException('User or category not found!');
    }

    return user;
  }

  async addGameRating(
    userId: string,
    gameId: number,
    rating: number,
  ): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      [
        {
          $set:{
            gamesRating:{
              $cond:{
                if:{
                  $in:[Number(gameId), "$gamesRating.game"]
                },
                then:{
                  $map:{
                    input: "$gamesRating",
                    as: "gameRating",
                    in:{
                      $cond:{
                        if:{$eq:["$$gameRating.game",Number(gameId)]},
                        then:{game:Number(gameId), rating:rating},
                        else: "$$gameRating"
                      }
                    }
                  }
                },
                else:{
                  $concatArrays:["$gamesRating",[{game:Number(gameId),rating: rating}]]
                }
              }
            },
            logs:{
              $cond:{
                if:{
                  $and:[
                    {$eq: [{$arrayElemAt:["$logs.gameId",-1]}, Number(gameId)]},
                    {$eq: [{ $arrayElemAt: ["$logs.isAdd", -1] }, true] },
                  ]

                },
                then:{
                  $concatArrays:[
                    {$slice: ["$logs",{$subtract:[{$size:"$logs"},1]}]},
                   [
                    {
                      date: new Date(Date.now()),
                      action:{$cond:{
                        if:{
                          $not: {
                            $regexMatch: {
                              input: { $arrayElemAt: ["$logs.action", -1] },
                              regex: /rating/
                            }
                          }
                        },
                        then:{
                          $concat:[
                            "rating and ",
                            { $arrayElemAt: ["$logs.action", -1] }
                          ]
                        },
                        else:{
                          $arrayElemAt:["$logs.action",-1]
                        }
                      }
                        
                      },
                      isAdd: true,
                      gameId: Number(gameId),
                      rating: rating
                    }
                  ]
                ]
                },
                else:{
                  $concatArrays:[
                    "$logs",
                    [{
                        date: new Date(Date.now()),
                        action: "rating",
                        isAdd: true,
                        rating: rating,
                        gameId: Number(gameId),
                    }]
                  ]
                }
              }
            }
          }
        }
      ],
      { new: true },
    );

    if (!user) {
      throw new BadRequestException('User not found!');
    }

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

  async getUserGamesLength(userId: string) {
    const user = await this.userModel.findById(userId);
    const gamesLength = {};

    categories.forEach((cat) => {
      gamesLength[cat] = user.games[cat].length;
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
}
