import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../user/schemas/user.schema";
import { IRole } from "src/shared/zod/schemas/role.schema";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(@InjectModel("User") private userModel: Model<User>) {}

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
}
