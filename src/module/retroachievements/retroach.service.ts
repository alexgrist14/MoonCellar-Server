import { Injectable } from '@nestjs/common';
import { buildAuthorization, getGameList } from '@retroachievements/api';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { RAGame } from './schemas/retroach.schema';
import mongoose, { Model } from 'mongoose';
import { IGame } from './interfaces/game.interface';
import { IDataBase } from './interfaces/retroachievements.interface';

@Injectable()
export class RetroachievementsService {
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;
  private readonly userName = 'alexgrist14';
  private readonly platforms = [...Array(78).keys()].map((i) => i + 1);

  constructor(
    @InjectModel(RAGame.name) private gameModel: mongoose.Model<RAGame>,
  ) {}

  private async saveGamesToDatabase(
    platformId: number,
    games: IGame[],
  ): Promise<void> {
    const gameDocuments = games.map((game) => ({
      ...game,
      platformId,
    }));
    await this.gameModel.insertMany(gameDocuments);
  }

  private async getGamesForPlatform(platformId: number): Promise<IGame[]> {
    const userName = this.userName;
    const webApiKey = this.apiKey;
    const authorization = buildAuthorization({ userName, webApiKey });
    const gameList = (await getGameList(authorization, {
      consoleId: platformId,
      shouldOnlyRetrieveGamesWithAchievements: false,
    })) as IGame[];

    return gameList;
  }

  private async getGamesForPlatformWithDelay(
    platformId: number,
    delay = 400,
  ): Promise<IGame[]> {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.getGamesForPlatform(platformId);
  }

  private async onModuleInit() {
    //await this.handleCron();
  }

  @Cron('0 0 * * *')
  private async handleCron() {
    const allGames = {} as IDataBase;

    for (const platformId of this.platforms) {
      try {
        console.log(platformId);
        const games = await this.getGamesForPlatformWithDelay(platformId);
        await this.saveGamesToDatabase(platformId, games);
        allGames[platformId] = games;
      } catch (error) {
        console.error(
          `Failed to fetch games for platform ${platformId}:`,
          error,
        );
      }
    }
  }

  async findGamesByPlatform(platformId: number): Promise<RAGame[]> {
    console.log(platformId);
    return this.gameModel.findOne({ consoleId: platformId });
  }

  async findAll(): Promise<RAGame[]> {
    return await this.gameModel.find().limit(50);
  }
}
