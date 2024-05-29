import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateEmailDto } from '../auth/dto/update-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async addGame(userId: string, gameId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    const gameObjectId = new Types.ObjectId(gameId);

    if (!user.games.includes(gameObjectId)) {
      user.games.push(gameObjectId);
      await user.save();
    }

    return user;
  }

  async findById(userId: string): Promise<User>{
    return await this.userModel.findById(userId);
  }

  async findAll(query: ExpressQuery):Promise<User[]>{
    const resPerPage = 2;
    const currentPage = +query.page || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return users;
  }

  async updateEmail(userId:string, UpdateEmailDto: UpdateEmailDto): Promise<User>{
    const user = await this.userModel.findById(userId);
    if(!user)
      throw new BadRequestException('User not found')

    user.email = UpdateEmailDto.newEmail;
    await user.save()
    return user;
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto):Promise<User>{
    const user = await this.userModel.findById(userId);
    if(!user)
      throw new BadRequestException('User not found');

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  }
}
