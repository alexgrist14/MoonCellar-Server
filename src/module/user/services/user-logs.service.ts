import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserLogs } from "../schemas/user-logs.schema";
import { ILogType } from "../types/logs";

@Injectable()
export class UserLogsService {
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>
  ) {}

  async createUserLog(
    userId: string,
    type: ILogType,
    text: string,
    gameId: number
  ) {
    const userLog = await this.userLogsModel.create({
      date: new Date(Date.now()),
      text,
      type,
      gameId,
      userId,
    });

    if (!userLog) {
      throw new BadRequestException("Something went wrong");
    }

    return userLog.save();
  }

  async getUserLogs(userId: string, take: number) {}
}
