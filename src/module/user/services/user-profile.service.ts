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
import { User } from "src/module/user/schemas/user.schema";
import { FileService } from "./file-upload.service";
import {
  IGetUserByIdRequest,
  IGetUserByStringRequest,
  IUpdateUserDescriptionRequest,
  IUpdateUserEmailRequest,
  IUpdateUserPasswordRequest,
} from "src/shared/zod/schemas/user.schema";

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private fileService: FileService
  ) {}

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
      ]);
  }
  async findByString({ searchString }: IGetUserByStringRequest): Promise<User> {
    return await this.userModel
      .findOne({
        $or: [{ userName: searchString }, { email: searchString }],
      })
      .select(["-password", "-createdAt", "-refreshToken", "-__v"]);
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
    { email }: IUpdateUserEmailRequest
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    user.email = email;
    await user.save();
    return user;
  }

  async updatePassword(
    userId: string,
    { oldPassword, newPassword }: IUpdateUserPasswordRequest
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatched)
      throw new UnauthorizedException("Password does not match");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.userModel.findById(userId);
    const avatarId = new mongoose.Types.ObjectId().toString();

    if (!user) throw new NotFoundException("User not found");

    await this.fileService.uploadFile(file, avatarId, "mooncellar-avatars");

    user.avatar = `https://mooncellar-avatars.s3.regru.cloud/${avatarId}`;

    return user.save();
  }

  async updateBackground(
    userId: string,
    file: Express.Multer.File
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    const backgroundId = new mongoose.Types.ObjectId().toString();

    if (!user) throw new NotFoundException("User not found");

    await this.fileService.uploadFile(
      file,
      backgroundId,
      "mooncellar-backgrounds"
    );

    user.background = `https://mooncellar-backgrounds.s3.regru.cloud/${backgroundId}`;

    return user.save();
  }

  async updateUserDescription(
    userId: string,
    { description }: IUpdateUserDescriptionRequest
  ) {
    const user = await this.userModel.findById(userId);

    user.description = description;
    await user.save();
    return user;
  }

  async updateUserTime(userId: string) {
    const user = await this.userModel.findById(userId);
    const now = new Date();
    const isoString = now.toISOString();
    const formattedDate = isoString.replace("Z", "+00:00");

    user.updatedAt = new Date(formattedDate);
    await user.save();
    return user;
  }
}
