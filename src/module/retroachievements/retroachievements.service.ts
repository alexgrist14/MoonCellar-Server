import { Injectable, Param } from '@nestjs/common';
import { buildAuthorization, getGameList } from '@retroachievements/api';
import { IDataBase, IGame } from 'src/models/retroachievements';
import * as fs from 'fs';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '../game/game.schema';
import { Model } from 'mongoose';

@Injectable()
export class RetroachievementsService {
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;
  private readonly userName = 'alexgrist14';
  private readonly platforms = [...Array(78).keys()].map((i) => i + 1);

  constructor(@InjectModel(Game.name) private gameModel: Model<GameDocument>) {}

  async saveGamesToDatabase(platformId: number, games: IGame[]): Promise<void>{
    const gameDocuments = games.map(game=>({
      ...game,
      platformId
    }));
    await this.gameModel.insertMany(gameDocuments);
  }

  async getGamesByPlatform(@Param('id') id: string): Promise<string> {
    const gamesData = fs.readFileSync('games.json', 'utf-8');
    const games = JSON.parse(gamesData);

    const platformGames = games[id];

    if (!platformGames) {
      return `No games found for platform with ID ${id}`;
    }

    return JSON.stringify(platformGames);
  }

  async getGamesForPlatform(platformId: number): Promise<IGame[]> {
    const userName = this.userName;
    const webApiKey = this.apiKey;
    const authorization = buildAuthorization({ userName, webApiKey });
    const gameList = (await getGameList(authorization, {
      consoleId: platformId,
      shouldOnlyRetrieveGamesWithAchievements: false,
    })) as IGame[];

    return gameList;
  }

  async getGamesForPlatformWithDelay(
    platformId: number,
    delay = 400,
  ): Promise<IGame[]> {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.getGamesForPlatform(platformId);
  }

  async saveGamesToFile(games: IDataBase, filePath: string): Promise<void> {
    fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
  }

  async onModuleInit() {
    //await this.handleCron();
  }

  @Cron('0 0 * * *')
  async handleCron() {
    const allGames = {} as IDataBase;

    for (const platformId of this.platforms) {
      try {
        console.log(platformId);
        const games = await this.getGamesForPlatformWithDelay(platformId);
        await this.saveGamesToDatabase(platformId,games);
        allGames[platformId] = games;
      } catch (error) {
        console.error(
          `Failed to fetch games for platform ${platformId}:`,
          error,
        );
      }
    }

    //await this.saveGamesToFile(allGames, 'games.json');
    
    console.log('Games have been saved to games.json');
  }

  async findGamesByPlatform(platformId: number): Promise<Game[]> {
    return this.gameModel.find();
  }
}
