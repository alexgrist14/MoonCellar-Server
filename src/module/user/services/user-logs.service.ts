import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { setPagination } from "src/shared/pagination";
import {
  IGetUserLogsRequest,
  ILog,
  IUserLog,
} from "src/shared/zod/schemas/user-logs.schema";
import { UserLogs } from "../schemas/user-logs.schema";

@Injectable()
export class UserLogsService {
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>
  ) {}

  async createUserLog({ userId, type, text, gameId }: IUserLog) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const gameObjectId = new mongoose.Types.ObjectId(gameId);
    const lastLog = await this.userLogsModel
      .findOne({ userId: userObjectId })
      .sort({ date: -1 });

    const isSameLog =
      lastLog?.gameId?.toString() === gameId?.toString() &&
      lastLog.type === type;

    if (isSameLog && lastLog.text == text) return;

    if (!lastLog || !isSameLog) {
      const userLog = await this.userLogsModel.create({
        date: new Date(),
        text,
        type,
        gameId: gameObjectId,
        userId: userObjectId,
      });
      return userLog.save();
    }

    lastLog.text = `${lastLog.text}<br/>${text}`;
    lastLog.date = new Date();
    return await lastLog.save();
  }

  async getUserLogs(
    userId: string,
    { take = 30, page = 1 }: IGetUserLogsRequest
  ): Promise<ILog[]> {
    const pagination = setPagination(page, take);
    return await this.userLogsModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $sort: { date: -1 },
      },
      ...pagination,
    ]);
  }
}
