import { Injectable } from '@nestjs/common';
import { buildAuthorization, getGameList } from '@retroachievements/api';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { RAGame } from '../schemas/retroach.schema';
import mongoose from 'mongoose';
import { RAConsole } from '../schemas/console.schema';
import { ConsoleService } from './console.service';
import { IDataBase, RA_MAIN_USER_NAME } from '../types/retroachievements';

@Injectable()
export class RetroachievementsService {
  constructor(
    @InjectModel(RAGame.name) private gameModel: mongoose.Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: mongoose.Model<RAConsole>,
    private readonly consoleService: ConsoleService,
  ) {}
  private readonly platforms = [...Array(78).keys()].map((i) => i + 1);
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  private async saveGamesToDB(
    platformId: number,
    games: RAGame[],
  ): Promise<void> {
    const gameDocuments = games.map((game) => ({
      ...game,
      platformId,
    }));
    await this.gameModel.insertMany(gameDocuments);
  }

  private async getGamesForPlatform(platformId: number): Promise<RAGame[]> {
    const userName = this.userName;
    const webApiKey = this.apiKey;
    const authorization = buildAuthorization({ userName, webApiKey });

    const platform = await this.consoleModel.findOne({ id: platformId });
    if (!platform)
      throw new Error(`Console with platformId ${platformId} not found`);

    const gameList = await getGameList(authorization, {
      consoleId: platformId,
      shouldOnlyRetrieveGamesWithAchievements: false,
    });

    const updatedGameList = gameList.map((game) => ({
      ...game,
      consoleId: platform._id,
    }));

    return updatedGameList as RAGame[];
  }

  private async getGamesForPlatformWithDelay(
    platformId: number,
    delay = 400,
  ): Promise<RAGame[]> {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.getGamesForPlatform(platformId);
  }

  //@Cron('0 0 * * *')
  async parseConsolesAndGames() {
    // await this.consoleService
    //   .parseConsoles(await this.consoleService.getConsoles())
    //   .then(async () => await this.parseGames());
  }

  private async parseGames() {
    await this.gameModel.deleteMany({});
    const allGames = {} as IDataBase;

    for (const platformId of this.platforms) {
      try {
        console.log(`${platformId} - parsed successfully`);
        const games = await this.getGamesForPlatformWithDelay(platformId);
        await this.saveGamesToDB(platformId, games);
        allGames[platformId] = games;
      } catch (error) {
        console.error(
          `Failed to fetch games for platform ${platformId}:`,
          error,
        );
      }
    }
  }

  async findAll(): Promise<RAGame[]> {
    return await this.gameModel.find();
  }

}
