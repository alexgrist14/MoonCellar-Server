import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ILogType, UserLogs } from "../schemas/user-logs.schema";

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

    await userLog.save();
    return userLog;
  }
}
