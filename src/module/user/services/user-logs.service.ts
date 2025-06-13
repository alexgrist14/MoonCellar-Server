import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { UserLogs } from "../schemas/user-logs.schema";
import { ILog, ILogType } from "../types/logs";
import { setPagination } from "src/shared/pagination";

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
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!userLog) {
      throw new BadRequestException("Something went wrong");
    }

    return userLog.save();
  }

  async getUserLogs(
    userId: string,
    take: number = 30,
    page = 1
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
      {
        $lookup: {
          from: "igdbgames",
          localField: "gameId",
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
          as: "game",
        },
      },
    ]);
  }
}
