import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  IAddUserRatingRequest,
  IGetUserRatingsRequest,
  IRemoveUserRatingRequest,
  IUpdateUserRatingRequest,
} from "src/shared/zod/schemas/user-ratings.schema";
import { Rating } from "../schemas/user-ratings.schema";
import { UserLogsService } from "./user-logs.service";

@Injectable()
export class UserRatingsService {
  constructor(
    @InjectModel(Rating.name)
    private userRatings: Model<Rating>,
    private readonly logsService: UserLogsService
  ) {}

  async addRating({ rating, userId, gameId }: IAddUserRatingRequest) {
    const userRating = await this.userRatings.create({
      rating,
      userId: new mongoose.Types.ObjectId(userId),
      gameId: new mongoose.Types.ObjectId(gameId),
    });
    if (userRating) {
      this.logsService.createUserLog({
        userId,
        type: "rating",
        text: `Set rating ${rating}`,
        gameId,
      });
    }

    return userRating;
  }

  async updateRating({ rating, _id, userId }: IUpdateUserRatingRequest) {
    const userRating = await this.userRatings.findOneAndUpdate(
      { _id },
      { rating },
      { new: true }
    );
    if (userRating) {
      this.logsService.createUserLog({
        userId,
        type: "rating",
        text: `Update rating to ${rating}`,
        gameId: userRating.gameId.toString(),
      });
    }
    return userRating;
  }

  async removeRating({ _id }: IRemoveUserRatingRequest) {
    return this.userRatings.findOneAndDelete({ _id });
  }

  async getRatings({ userId }: IGetUserRatingsRequest) {
    return this.userRatings.find({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }
}
