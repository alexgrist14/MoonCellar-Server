import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  GamesPlaythroughs,
  IGamesPlaythroughsDocument,
} from "./schemas/games-playthroughs.schema";
import mongoose, { Model } from "mongoose";
import {
  IGetPlaythroughsRequest,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "src/shared/zod/schemas/playthroughs.schema";
import { UserLogsService } from "../user/services/user-logs.service";

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(GamesPlaythroughs.name)
    private GamesPlaythrouhgs: Model<IGamesPlaythroughsDocument>,
    private readonly logsService: UserLogsService
  ) {}

  async getPlaythroughs(data: IGetPlaythroughsRequest) {
    return await this.GamesPlaythrouhgs.find({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async getPlaythroughsMinimal(data: IGetPlaythroughsRequest) {
    return await this.GamesPlaythrouhgs.find({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    }).select("_id category gameId isMastered updatedAt");
  }

  async savePlaythrough(data: ISavePlaythroughRequest) {
    const play = await this.GamesPlaythrouhgs.create({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.logsService.createUserLog(
      play.userId.toString(),
      "list",
      `Added to ${play.isMastered ? "mastered" : play.category}`,
      play.gameId
    );

    return play;
  }

  async updatePlaythrough(
    id: mongoose.Types.ObjectId,
    data: IUpdatePlaythroughRequest
  ) {
    const play = await this.GamesPlaythrouhgs.findOneAndUpdate(
      { _id: id },
      { ...data, updatedAt: new Date().toISOString() },
      {
        new: true,
      }
    );

    await this.logsService.createUserLog(
      play.userId.toString(),
      "list",
      `Added to ${play.isMastered ? "mastered" : play.category}`,
      play.gameId
    );

    return play;
  }

  async deletePlaythrough(id: mongoose.Types.ObjectId) {
    const play = await this.GamesPlaythrouhgs.findOneAndDelete(
      { _id: id },
      {
        new: true,
      }
    );

    await this.logsService.createUserLog(
      play.userId.toString(),
      "list",
      `Removed from ${play.isMastered ? "mastered" : play.category}`,
      play.gameId
    );

    return play;
  }
}
