import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";
import { followersLookup } from "src/shared/utils";

@Injectable()
export class UserFollowingsService {
  private readonly logger = new Logger(UserFollowingsService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async addUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException("User not found");
    if (user.followings.includes(new mongoose.Types.ObjectId(followingId)))
      throw new ConflictException(`User already in following list`);
    try {
      user.followings.push(new mongoose.Types.ObjectId(followingId));
      await user.save();
      return (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followersLookup(),
        ])
      ).pop();
    } catch (err) {
      this.logger.error(err, `Failed to add user following: ${userId}`);
      throw new err();
    }
  }

  async removeUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException("User not found");
    try {
      user.followings = user.followings.filter(
        (user) => user.toString() !== followingId
      );
      await user.save();
      return (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followersLookup(),
        ])
      ).pop();
    } catch (err) {
      this.logger.error(err, `Failed to remove user following: ${userId}`);
      throw new err();
    }
  }

  async getUserFollowings(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    return (
      await this.userModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) },
        },
        ...followersLookup(),
      ])
    ).pop();
  }
}
