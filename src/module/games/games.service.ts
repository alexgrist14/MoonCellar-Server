import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  GamesPlaythroughs,
  IGamesPlaythroughsDocument,
} from "./schemas/games-playthroughs.schema";
import { Model } from "mongoose";
import { SavePlaythroughDTO } from "./dto/save-playthrough.dto";

@Injectable()
export class GamesService {
  constructor(
    // @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(GamesPlaythroughs.name)
    private IGamesPlaythrouhgs: Model<IGamesPlaythroughsDocument>
  ) {}

  async savePlaythrough(data: SavePlaythroughDTO) {
    return this.IGamesPlaythrouhgs.create(data);
  }
}
