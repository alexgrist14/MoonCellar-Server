import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../user/schemas/user.schema";
import { IRole } from "src/shared/zod/schemas/role.schema";

@Injectable()
export class AdminService {
  constructor(@InjectModel("User") private userModel: Model<User>) {}

  async getAllUsers() {
    return this.userModel
      .find()
      .select("-password -__v -logs -gamesRating")
      .exec();
  }

  async getUserById(userId: string) {
    return this.userModel
      .findById(userId)
      .select("-password -__v -logs -gamesRating")
      .exec();
  }

  async addUserRole(userId: string, role: IRole) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { roles: role } }, { new: true })
      .select("-password -__v")
      .exec();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
