import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserLogs } from "../schemas/user-logs.schema";
import { categoriesType } from "../types/actions";

@Injectable()
export class UserLogsService {
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>
  ) {}
  async createUserLog(
    userId: string,
    category: categoriesType,
    isAdd: boolean,
    gameId: number
  ) {
    const userLog = await this.userLogsModel.create({
      date: new Date(Date.now()),
      action: category,
      isAdd: isAdd,
      gameId: gameId,
      userId: userId,
    });

    if (!userLog) {
      throw new BadRequestException("Something went wrong");
    }
    await userLog.save();
    return userLog;
  }
}
