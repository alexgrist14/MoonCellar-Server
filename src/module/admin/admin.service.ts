import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { User } from "../user/schemas/user.schema";
import { UserLogs } from "../user/schemas/user-logs.schema";
import { Rating } from "../user/schemas/user-ratings.schema";
import { Playthrough } from "../games/schemas/playthroughs.schema";
import { Game, GameDocument } from "../games/schemas/game.schema";
import type { IRole } from "src/shared/zod/schemas/role.schema";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Playthrough.name) private playthroughModel: Model<Playthrough>,
    @InjectModel(Game.name) private Games: Model<GameDocument>
  ) {}

  async getAllUsers() {
    this.logger.log("Getting all users");
    try {
      return this.userModel
        .find()
        .select("-password -__v -logs -gamesRating")
        .exec();
    } catch (error) {
      this.logger.error(error, "Error getting all users");
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      return this.userModel
        .findById(userId)
        .select("-password -__v -logs -gamesRating")
        .exec();
    } catch (error) {
      this.logger.error(error, `Error getting user ${userId}`);
      throw error;
    }
  }

  async addUserRole(userId: string, role: IRole) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $addToSet: { roles: role } },
          { new: true }
        )
        .select("-password -__v")
        .exec();

      if (!user) {
        throw new NotFoundException("User not found");
      }

      return user;
    } catch (error) {
      this.logger.error(error, `Error adding user role ${userId} ${role}`);
      throw error;
    }
  }

  async removeUserRole(userId: string, role: IRole) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(userId, { $pull: { roles: role } }, { new: true })
        .select("-password -__v")
        .exec();

      if (!user) {
        throw new NotFoundException("User not found");
      }

      return user;
    } catch (error) {
      this.logger.error(error, `Error removing user role ${userId} ${role}`);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    this.logger.log(`Deleting user ${userId} and all related data`);
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException("User not found");
      }

      await Promise.all([
        this.userLogsModel.deleteMany({ userId } as FilterQuery<UserLogs>).exec(),
        this.ratingModel.deleteMany({ userId } as FilterQuery<Rating>).exec(),
        this.playthroughModel
          .deleteMany({ userId } as FilterQuery<Playthrough>)
          .exec(),
        this.userModel.findByIdAndDelete(userId).exec(),
      ]);

      this.logger.log(
        `Successfully deleted user ${userId} and all related data`
      );

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      this.logger.error(error, `Error deleting user ${userId}`);
      throw error;
    }
  }

  async getGameById(gameId: string) {
    const game = await this.Games.findById(gameId).lean();

    if (!game) throw new NotFoundException(`Game not found: ${gameId}`);

    return game;
  }
}
