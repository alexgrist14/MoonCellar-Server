import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  IGetPlaythroughsRequest,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "src/shared/zod/schemas/playthroughs.schema";
import { UserLogsService } from "src/module/user/services/user-logs.service";
import { Platform, PlatformDocument } from "../schemas/platform.schema";
import {
  IPlaythroughDocument,
  Playthrough,
} from "../schemas/playthroughs.schema";

@Injectable()
export class PlaythroughsService {
  constructor(
    @InjectModel(Playthrough.name)
    private GamesPlaythrouhgs: Model<IPlaythroughDocument>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    private readonly logsService: UserLogsService
  ) {}

  private async getAdditionalInfo({
    stringStart,
    play,
  }: {
    stringStart: "Added to" | "Removed from";
    play: IPlaythroughDocument;
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
      gameId: play.gameId.toString(),
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
      gameId: play.gameId.toString(),
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
      gameId: play.gameId.toString(),
    });

    return play;
  }
}
