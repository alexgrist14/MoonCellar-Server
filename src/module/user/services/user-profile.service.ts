import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import { Query as ExpressQuery } from "express-serve-static-core";
import mongoose, { Model } from "mongoose";
import { UpdateEmailDto } from "src/module/auth/dto/update-email.dto";
import { UpdatePasswordDto } from "src/module/auth/dto/update-password.dto";
import { User } from "src/module/user/schemas/user.schema";
import { IUserLogs } from "../types/actions";

@Injectable()
export class UserProfileService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getUserLogs(userId: string) {
    return (await this.userModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: {
          logs: { $reverseArray: { $slice: ["$logs", -50] } },
        },
      },
      {
        $unwind: "$logs",
      },
      {
        $lookup: {
          from: "igdbgames",
          localField: "logs.gameId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1,
                slug: 1,
                cover: 1,
              },
            },
            {
              $lookup: {
                from: "igdbcovers",
                localField: "cover",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: { url: 1, _id: 0 },
                  },
                ],
                as: "cover",
              },
            },
            { $unwind: "$cover" },
          ],
          as: "logs.game",
        },
      },
      {
        $unwind: "$logs.game",
      },
      {
        $group: {
          _id: "$_id",
          logs: { $push: "$logs" },
        },
      },
    ])) as IUserLogs[];
  }

  async findById(userId: string): Promise<User> {
    return await this.userModel
      .findById(userId)
      .select([
        "-password",
        "-logs",
        "-createdAt",
        "-updatedAt",
        "-refreshToken",
        "-__v",
        "-games",
      ]);
  }
  async findByString(
    searchString: string,
    searchType: "userName" | "email"
  ): Promise<User> {
    return await this.userModel
      .findOne({ [searchType]: searchString })
      .select(["-password", "-createdAt", "-refreshToken", "-__v", "-games"]);
  }

  async findAll(query: ExpressQuery): Promise<User[]> {
    const resPerPage = 2;
    const currentPage = +query.page || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: "i",
          },
        }
      : {};
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return users;
  }

  async updateEmail(
    userId: string,
    UpdateEmailDto: UpdateEmailDto
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    user.email = UpdateEmailDto.newEmail;
    await user.save();
    return user;
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    const isPasswordMatched = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password
    );
    if (!isPasswordMatched)
      throw new UnauthorizedException("Password does not match");

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  }

  async updateProfileBackground(userId: string, link: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    user.background = link;
    return user.save();
  }

  async updateProfilePicture(userId: string, fileName: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    user.profilePicture = fileName;
    return user.save();
  }

  async getProfilePicture(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    console.log(user.profilePicture);
    // if (!user || !user.profilePicture)
    //   throw new NotFoundException('Profile picture not found');

    return user.profilePicture;
  }

  async getProfileBackground(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.background)
      throw new NotFoundException("Profile picture not found");

    return user.background;
  }

  async updateUserDescription(userId: string, description: string) {
    const user = await this.userModel.findById(userId);

    user.description = description;
    await user.save();
    return user;
  }
}
