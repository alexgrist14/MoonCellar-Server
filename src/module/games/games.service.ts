import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  GamesPlaythroughs,
  IGamesPlaythroughsDocument,
} from "./schemas/games-playthroughs.schema";
import mongoose, { Model } from "mongoose";
import {
  GetPlaythroughsDTO,
  SavePlaythroughDTO,
  UpdatePlaythroughDTO,
} from "./dto/playthrough.dto";

@Injectable()
export class GamesService {
  constructor(
    // @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(GamesPlaythroughs.name)
    private GamesPlaythrouhgs: Model<IGamesPlaythroughsDocument>
  ) {}

  async getPlaythroughs(data: GetPlaythroughsDTO) {
    return await this.GamesPlaythrouhgs.find({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async savePlaythrough(data: SavePlaythroughDTO) {
    return await this.GamesPlaythrouhgs.create(data);
  }

  async updatePlaythrough(
    id: mongoose.Types.ObjectId,
    data: UpdatePlaythroughDTO
  ) {
    return await this.GamesPlaythrouhgs.findOneAndUpdate({ _id: id }, data);
  }

  async deletePlaythrough(id: mongoose.Types.ObjectId) {
    return await this.GamesPlaythrouhgs.findOneAndDelete({ _id: id });
  }
}
