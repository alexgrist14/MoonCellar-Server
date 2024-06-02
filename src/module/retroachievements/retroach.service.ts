import { Injectable } from '@nestjs/common';
import {
  buildAuthorization,
  getConsoleIds,
  getGameList,
} from '@retroachievements/api';
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

  private async getConsoleIds() {
    const authorization = buildAuthorization({
      userName: this.userName,
      webApiKey: this.apiKey,
    });
    const consoleIds = await getConsoleIds(authorization);
    return consoleIds;
  }

  private async onModuleInit() {
    //await this.handleCron();
  }

  @Cron('0 0 * * *')
  private async handleCron() {
    await this.gameModel.deleteMany({});
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

  async findConsolesIds() {
    return await this.getConsoleIds();
  }

  async findGamesByPlatform(
    platformId: number,
    onlyWithAchievements,
    withoutSubsets
  ): Promise<RAGame[]> {
    let games = await this.gameModel.find({ consoleId: platformId });
    
    if (onlyWithAchievements === 'true') {
      games = games.filter(game => game.numAchievements > 0);
    }
  
    if (withoutSubsets === 'true') {
      games = games.filter(game => !game.title.includes('~') && !game.title.includes('Subset'));
    }

    return games;
  }

  async findAll(): Promise<RAGame[]> {
    return await this.gameModel.find().limit(50);
  }

  async findGameById(gameId: string): Promise<RAGame> {
    return await this.gameModel.findById(gameId);
  }

  async findRandomGamesByPlatforms(
    platformIds: number[],
    onlyWithAchievements: boolean,
    withoutSubsets: boolean
  ): Promise<{ [key: number]: RAGame[] }> {
    const results: { [key: number]: RAGame[] } = {};

    for (const platformId of platformIds) {
      const games = await this.findGamesByPlatform(
        platformId,
        onlyWithAchievements,
        withoutSubsets
      );
      const randomGames = this.getRandomSubset(games, 16);
      results[platformId] = randomGames;
    }

    return results;
  }

  private getRandomSubset<T>(array: T[], size: number): T[] {
    const shuffled = Array.from(array);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }
}
