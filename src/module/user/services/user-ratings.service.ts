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

@Injectable()
export class UserRatingsService {
  constructor(
    @InjectModel(Rating.name)
    private userRatings: Model<Rating>
  ) {}

  async addRating({ rating, userId, gameId }: IAddUserRatingRequest) {
    return this.userRatings.create({
      rating,
      userId: new mongoose.Types.ObjectId(userId),
      gameId: new mongoose.Types.ObjectId(gameId),
    });
  }

  async updateRating({ rating, _id }: IUpdateUserRatingRequest) {
    return this.userRatings.findOneAndUpdate(
      { _id },
      { rating },
      { new: true }
    );
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
