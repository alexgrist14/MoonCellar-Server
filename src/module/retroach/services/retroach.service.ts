import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  buildAuthorization,
  GameList,
  getConsoleIds,
  getGameList,
} from '@retroachievements/api';
import mongoose from 'mongoose';
import { updateOrInsertValues } from 'src/shared/db';

import { RAConsole } from '../schemas/console.schema';
import { RAGame } from '../schemas/retroach.schema';
import { RA_MAIN_USER_NAME } from 'src/shared/constants';

@Injectable()
export class RetroachievementsService {
  constructor(
    @InjectModel(RAGame.name) private gameModel: mongoose.Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: mongoose.Model<RAConsole>,
  ) {}
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  async parse(type: 'consoles' | 'games' | 'both') {
    const authorization = buildAuthorization({
      userName: this.userName,
      webApiKey: this.apiKey,
    });
    const consoles = await getConsoleIds(authorization);
    let index = 0;

    console.log(`Consoles: ${consoles.length}`);

    const getGames = (consoleId: number, games: GameList) => {
      getGameList(authorization, {
        consoleId,
        shouldOnlyRetrieveGamesWithAchievements: true,
      }).then((res) => {
        console.log(`Step: ${index + 1}. Games: ${games.length + res.length}`);

        setTimeout(() => {
          index++;
          index <= consoles.length - 1
            ? getGames(consoles[index].id, [...games, ...res])
            : updateOrInsertValues(this.gameModel, [...games, ...res]);
        }, 400);
      });
    };

    if (type === 'consoles') {
      return updateOrInsertValues(this.consoleModel, consoles);
    }

    if (type === 'games') {
      return getGames(consoles[index].id, []);
    }

    if (type === 'both') {
      await updateOrInsertValues(this.consoleModel, consoles);

      return getGames(consoles[index].id, []);
    }
  }
}
