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
import { User } from "../user/schemas/user.schema";
import { categories, CategoriesType } from "../user/types/actions";

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(GamesPlaythroughs.name)
    private GamesPlaythrouhgs: Model<IGamesPlaythroughsDocument>
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
    }).select("_id category gameId isMastered");
  }

  async savePlaythrough(data: ISavePlaythroughRequest) {
    return await this.GamesPlaythrouhgs.create({
      ...data,
      createdAt: new Date().toISOString(),
      updateAt: new Date().toISOString(),
    });
  }

  async updatePlaythrough(
    id: mongoose.Types.ObjectId,
    data: IUpdatePlaythroughRequest
  ) {
    return await this.GamesPlaythrouhgs.findOneAndUpdate(
      { _id: id },
      { ...data, updateAt: new Date().toISOString() },
      {
        new: true,
      }
    );
  }

  async deletePlaythrough(id: mongoose.Types.ObjectId) {
    return await this.GamesPlaythrouhgs.findOneAndDelete(
      { _id: id },
      {
        new: true,
      }
    );
  }

  async parsePlaythroughs() {
    const users = await this.userModel.find();

    for (const user of users) {
      console.log(user.userName);
      for (const key in user.games) {
        if (
          !!user.games?.[key]?.length &&
          categories.includes(key as CategoriesType)
        ) {
          console.log(key);
          for (const gameId of user.games[key]) {
            await this.GamesPlaythrouhgs.create({
              userId: user._id,
              gameId,
              category: key === "mastered" ? "completed" : key,
              isMastered: key === "mastered",
            });
          }
        }
      }
    }

    return;
  }
}
