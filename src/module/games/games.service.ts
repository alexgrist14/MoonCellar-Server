import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  IGetPlaythroughsRequest,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "src/shared/zod/schemas/playthroughs.schema";
import { UserLogsService } from "../user/services/user-logs.service";
import {
  GamesPlaythroughs,
  IGamesPlaythroughsDocument,
} from "./schemas/games-playthroughs.schema";
import {
  IGDBPlatforms,
  IGDBPlatformsDocument,
} from "../igdb/schemas/igdb-platforms.schema";

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(GamesPlaythroughs.name)
    private GamesPlaythrouhgs: Model<IGamesPlaythroughsDocument>,
    @InjectModel(IGDBPlatforms.name)
    private Platforms: Model<IGDBPlatformsDocument>,
    private readonly logsService: UserLogsService
  ) {}

  private async getAdditionalInfo({
    stringStart,
    play,
  }: {
    stringStart: "Added to" | "Removed from";
    play: IGamesPlaythroughsDocument;
  }) {
    const platform = await this.Platforms.findById(play.platformId);
    const text =
      `${stringStart} ${play.isMastered ? "mastered" : play.category}` +
      (!!platform ? `<br/><i>${platform.name}</i>` : "");

    return { platform, text };
  }

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

    const { text } = await this.getAdditionalInfo({
      play,
      stringStart: "Added to",
    });

    await this.logsService.createUserLog({
      userId: play.userId.toString(),
      type: "list",
      text,
      gameId: play.gameId,
    });

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

    const { text } = await this.getAdditionalInfo({
      play,
      stringStart: "Added to",
    });

    await this.logsService.createUserLog({
      userId: play.userId.toString(),
      type: "list",
      text,
      gameId: play.gameId,
    });

    return play;
  }

  async deletePlaythrough(id: mongoose.Types.ObjectId) {
    const play = await this.GamesPlaythrouhgs.findOneAndDelete(
      { _id: id },
      {
        new: true,
      }
    );

    const { text } = await this.getAdditionalInfo({
      play,
      stringStart: "Removed from",
    });

    await this.logsService.createUserLog({
      userId: play.userId.toString(),
      type: "list",
      text,
      gameId: play.gameId,
    });

    return play;
  }
}
