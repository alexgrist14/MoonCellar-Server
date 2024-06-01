import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGDBGame, IGDBGameDocument } from './schemas/igdb-games.schema';
import { igdbAuth, igdbParser } from './utils/igdb';

@Injectable()
export class IgdbService {
  constructor(
    @InjectModel(IGDBGame.name) private IGDBGameModel: Model<IGDBGameDocument>,
  ) {}

  async getGames(take: number): Promise<IGDBGame[]> {
    return this.IGDBGameModel.find({}, { limit: take });
  }
  private async onModuleInit() {
    // await this.IGDBGameModel.deleteMany({});
    // igdbAuth().then((response) => {
    //   !!response.data.access_token &&
    //     igdbParser(
    //       response.data.access_token,
    //       'games',
    //       (games) => {
    //         this.IGDBGameModel.insertMany(games);
    //       },
    //       this.IGDBGameModel,
    //     );
    // });
  }
}
