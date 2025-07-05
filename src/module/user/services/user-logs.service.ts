import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { setPagination } from "src/shared/pagination";
import { UserLogs } from "../schemas/user-logs.schema";
import { ILog, UserLog } from "../types/logs";

@Injectable()
export class UserLogsService {
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>
  ) {}

  async createUserLog({ userId, type, text, gameId }: UserLog) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
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
        gameId,
        userId: userObjectId,
      });
      return userLog.save();
    }

    // let newText = lastLog.text;

    // if (type === "list" && lastLog.type === "rating") {
    //   lastLog.type = "list";
    //   newText = newText ? `${text} and ${newText.toLocaleLowerCase()}` : text;
    // }
    //
    // if (type === "list" && lastLog.type !== "rating") {
    //   if (newText.startsWith("Removed from")) {
    //     newText = newText.replace(/^Removed from [^ ]+/, text);
    //   } else {
    //     newText = newText.replace(/^Added to [^ ]+/, text);
    //   }
    // }
    //
    // if (type === "rating") {
    //   newText = newText
    //     .replace(/Changed rating from \d+ to \d+/i, "")
    //     .replace(/set rating \d+/i, "")
    //     .replace(/and\s+$/, "")
    //     .replace(/^and\s+/, "")
    //     .replace(/\s{2,}/g, " ")
    //     .trim();
    //
    //   const newRating = text.match(/\d+/)?.[0] ?? "";
    //
    //   if (lastLog.type === "rating") {
    //     const previousRating = lastLog.text.match(/\d+/)?.[0] ?? "";
    //     newText = newText
    //       ? `${newText} and Changed rating from ${previousRating} to ${newRating}`
    //       : `Changed rating from ${previousRating} to ${newRating}`;
    //   } else {
    //     newText = newText ? `${newText} and ${text.toLowerCase()}` : text;
    //   }
    // }

    lastLog.text = `${lastLog.text}<br/>${text}`;
    lastLog.date = new Date();
    return await lastLog.save();
  }

  async getUserLogs(userId, take = 30, page = 1): Promise<ILog[]> {
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
