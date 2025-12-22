import { Injectable, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(UserRatingsService.name);
  constructor(
    @InjectModel(Rating.name)
    private userRatings: Model<Rating>,
    private readonly logsService: UserLogsService
  ) {}

  async addRating({ rating, userId, gameId }: IAddUserRatingRequest) {
    try {
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
    } catch (err) {
      this.logger.error(err, `Failed to add rating: ${userId}`);
      throw new err();
    }
  }

  async updateRating({ rating, _id, userId }: IUpdateUserRatingRequest) {
    try {
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
    } catch (err) {
      this.logger.error(err, `Failed to update rating: ${userId}`);
      throw new err();
    }
  }

  async removeRating({ _id }: IRemoveUserRatingRequest) {
    try {
      return this.userRatings.findOneAndDelete({ _id });
    } catch (err) {
      this.logger.error(err, `Failed to remove rating: ${_id}`);
      throw new err();
    }
  }

  async getRatings({ userId }: IGetUserRatingsRequest) {
    try {
      return this.userRatings.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
    } catch (err) {
      this.logger.error(err, `Failed to get ratings: ${userId}`);
      throw new err();
    }
  }
}
