import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";
import { gamesLookup } from "src/shared/utils";
import { categories, CategoriesType } from "../types/actions";

@Injectable()
export class UserGamesService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async addGameRating(
    userId: string,
    gameId: number,
    rating: number
  ): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      [
        {
          $set: {
            gamesRating: {
              $cond: {
                if: {
                  $in: [Number(gameId), "$gamesRating.game"],
                },
                then: {
                  $map: {
                    input: "$gamesRating",
                    as: "gameRating",
                    in: {
                      $cond: {
                        if: { $eq: ["$$gameRating.game", Number(gameId)] },
                        then: { game: Number(gameId), rating: rating },
                        else: "$$gameRating",
                      },
                    },
                  },
                },
                else: {
                  $concatArrays: [
                    "$gamesRating",
                    [{ game: Number(gameId), rating: rating }],
                  ],
                },
              },
            },
            logs: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: [
                        { $arrayElemAt: ["$logs.gameId", -1] },
                        Number(gameId),
                      ],
                    },
                    { $eq: [{ $arrayElemAt: ["$logs.isAdd", -1] }, true] },
                  ],
                },
                then: {
                  $concatArrays: [
                    {
                      $slice: ["$logs", { $subtract: [{ $size: "$logs" }, 1] }],
                    },
                    [
                      {
                        date: new Date(Date.now()),
                        action: {
                          $cond: {
                            if: {
                              $not: {
                                $regexMatch: {
                                  input: { $arrayElemAt: ["$logs.action", -1] },
                                  regex: /rating/,
                                },
                              },
                            },
                            then: {
                              $concat: [
                                "rating and ",
                                { $arrayElemAt: ["$logs.action", -1] },
                              ],
                            },
                            else: {
                              $arrayElemAt: ["$logs.action", -1],
                            },
                          },
                        },
                        isAdd: true,
                        gameId: Number(gameId),
                        rating: rating,
                      },
                    ],
                  ],
                },
                else: {
                  $concatArrays: [
                    "$logs",
                    [
                      {
                        date: new Date(Date.now()),
                        action: "rating",
                        isAdd: true,
                        rating: rating,
                        gameId: Number(gameId),
                      },
                    ],
                  ],
                },
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("User not found!");
    }

    return user;
  }

  async removeGameRating(userId: string, gameId: number): Promise<User> {
    await this.userModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $pull: { gamesRating: { game: Number(gameId) } } }
    );
    const user = await this.userModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      [
        {
          $set: {
            logs: {
              $concatArrays: [
                "$logs",
                [
                  {
                    date: new Date(Date.now()),
                    action: "rating",
                    isAdd: false,
                    gameId: Number(gameId),
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("User not found!");
    }

    return user;
  }
}
