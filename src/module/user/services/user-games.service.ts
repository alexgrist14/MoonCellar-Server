import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";
import { UserLogsService } from "./user-logs.service";

@Injectable()
export class UserGamesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly logsService: UserLogsService
  ) {}

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
          },
        },
      ],
      { new: true }
    );

    await this.logsService.createUserLog({
      userId: userId,
      type: "rating",
      text: `Set rating ${rating}`,
      gameId: gameId,
    });

    if (!user) {
      throw new BadRequestException("User not found!");
    }

    return user;
  }

  async removeGameRating(userId: string, gameId: number): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $pull: { gamesRating: { game: Number(gameId) } } }
    );

    if (!user) {
      throw new BadRequestException("User not found!");
    }

    return user;
  }
}
