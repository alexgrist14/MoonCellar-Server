import { Injectable } from '@nestjs/common';
import { buildAuthorization, getGameList } from '@retroachievements/api';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { RAGame } from '../schemas/retroach.schema';
import mongoose from 'mongoose';
import { IDataBase } from '../interfaces/retroachievements.interface';
import { RAConsole } from '../schemas/console.schema';

@Injectable()
export class RetroachievementsService {
  constructor(
    @InjectModel(RAGame.name) private gameModel: mongoose.Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: mongoose.Model<RAConsole>,
  ) {}
  private readonly platforms = [...Array(78).keys()].map((i) => i + 1);
  private readonly userName = 'alexgrist14';
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
      title: game.title,
      id: game.id,
      consoleId: platform._id,
      consoleName: game.consoleName,
      imageIcon: game.imageIcon,
      numAchievements: game.numAchievements,
    }));

    return updatedGameList as unknown as RAGame[];
  }

  private async getGamesForPlatformWithDelay(
    platformId: number,
    delay = 400,
  ): Promise<RAGame[]> {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.getGamesForPlatform(platformId);
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

  async findGamesByPlatform(
    platformId: number,
    isOnlyWithAchievements,
    isWithoutSubsets,
  ): Promise<RAGame[]> {
    let games = await this.gameModel.find({ consoleId: platformId });

    if (isOnlyWithAchievements === 'true') {
      games = games.filter((game) => game.numAchievements > 0);
    }

    if (isWithoutSubsets === 'true') {
      games = games.filter(
        (game) => !game.title.includes('~') && !game.title.includes('Subset'),
      );
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
    platformIds: string[],
    isOnlyWithAchievements: string,
    isWithoutSubsets: string,
  ): Promise<RAGame[]> {
    console.log(Array.isArray(platformIds));
    const games = await this.gameModel.aggregate([
      {
        $match: {
          numAchievements:
            isOnlyWithAchievements === 'true'
              ? {
                  $gt: 0,
                }
              : { $gte: 0 },
          ...(isWithoutSubsets === 'true' && {
            title: {
              $not: {
                $regex: /(Subset|~)/,
              },
            },
          }),
          consoleId: {
            $in: Array.isArray(platformIds)
              ? platformIds.map((el) => new mongoose.Types.ObjectId(el))
              : [new mongoose.Types.ObjectId(platformIds)],
          },
        },
      },
      {
        $sample: {
          size: 16,
        },
      },
    ]);
    return games;
  }
}
