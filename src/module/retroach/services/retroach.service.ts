import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  buildAuthorization,
  GameList,
  getConsoleIds,
  getGameList,
} from "@retroachievements/api";
import { Model } from "mongoose";
import { updateOrInsertValues } from "src/shared/db";

import { RAConsole } from "../schemas/console.schema";
import { RAGame } from "../schemas/retroach.schema";
import { RA_MAIN_USER_NAME } from "src/shared/constants";
import { getFormattedTitle } from "src/shared/utils";
import {
  IGDBGames,
  IGDBGamesDocument,
} from "src/shared/schemas/igdb-games.schema";

@Injectable()
export class RetroachievementsService {
  constructor(
    @InjectModel(RAGame.name) private gameModel: Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: Model<RAConsole>,
    @InjectModel(IGDBGames.name)
    private IGDBGamesModel: Model<IGDBGamesDocument>
  ) {}
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  async parse(type: "consoles" | "games" | "both") {
    const authorization = buildAuthorization({
      username: this.userName,
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
        console.log(
          `Console: ${index + 1} ${consoles[index].name}. Games: ${games.length} + ${res.length}`
        );

        setTimeout(() => {
          index++;
          return index <= consoles.length - 1
            ? getGames(consoles[index].id, [...games, ...res])
            : updateOrInsertValues(this.gameModel, [...games, ...res]);
        }, 400);
      });
    };

    if (type === "consoles") {
      return updateOrInsertValues(this.consoleModel, consoles);
    }

    if (type === "games") {
      return getGames(consoles[index].id, []);
    }

    if (type === "both") {
      await updateOrInsertValues(this.consoleModel, consoles);

      return getGames(consoles[index].id, []);
    }
  }

  async parseRAGames() {
    const raConsoles = await this.consoleModel.find();
    const raGames = await this.gameModel.find();
    const IGDBGames = await this.IGDBGamesModel.find().select("name platforms");

    const IGDBGamesSorted = IGDBGames.reduce(
      (
        result: {
          [key: string]: { _id: number; name: string; platforms: number[] }[];
        },
        game
      ) => {
        const title = getFormattedTitle(game.name);

        Array.isArray(result[title]) && !!result[title]?.length
          ? result[title].push(game)
          : (result[title] = [game]);

        return result;
      },
      {}
    );

    const gameIds = raGames.reduce((result, ragame) => {
      const title = getFormattedTitle(ragame.title);
      const igames: { _id: number; name: string; platforms: number[] }[] =
        title.includes("|")
          ? IGDBGamesSorted[title.split("|")[0]] ||
            IGDBGamesSorted[title.split("|")[1]]
          : IGDBGamesSorted[title];

      const raConsole = raConsoles.find(
        (console) => console._id === ragame.consoleId
      );

      const tempRaGame = {
        ...ragame,
        consoleId: raConsole?.igdbIds || null,
      };

      const igame = igames?.find(
        (game) =>
          !!tempRaGame.consoleId &&
          game.platforms.some((id: number) => tempRaGame.consoleId.includes(id))
      );

      if (!!igame) {
        !!result[igame._id]?.length
          ? result[igame._id].push(ragame._id)
          : (result[igame._id] = [ragame._id]);
      }

      return result;
    }, {});

    console.log(Object.values(gameIds).flat().length);

    await this.IGDBGamesModel.bulkWrite(
      Object.keys(gameIds).map((key) => ({
        updateOne: {
          filter: {
            _id: key,
          },
          update: [
            {
              $set: {
                raIds: {
                  $cond: [
                    {
                      $ifNull: ["$raIds", false],
                    },
                    {
                      $setUnion: ["$raIds", gameIds[key]],
                    },
                    gameIds[key],
                  ],
                },
              },
            },
          ],
        },
      }))
    );

    console.log("Parsing ended");
    return "Success";
  }

  async getUnrecognised() {
    const raConsoles = await this.consoleModel.find();
    const raGames = await this.gameModel.find();
    const IGDBGames = await this.IGDBGamesModel.find().select("name platforms");

    const IGDBGamesSorted = IGDBGames.reduce(
      (
        result: {
          [key: string]: { _id: number; name: string; platforms: number[] }[];
        },
        game
      ) => {
        const title = getFormattedTitle(game.name);

        Array.isArray(result[title]) && !!result[title]?.length
          ? result[title].push(game)
          : (result[title] = [game]);

        return result;
      },
      {}
    );

    const unrecognised = raGames.reduce((result, ragame) => {
      const title = getFormattedTitle(ragame.title);
      const igames: { _id: number; name: string; platforms: number[] }[] =
        title.includes("|")
          ? IGDBGamesSorted[title.split("|")[0]] ||
            IGDBGamesSorted[title.split("|")[1]]
          : IGDBGamesSorted[title];

      const raConsole = raConsoles.find(
        (console) => console._id === ragame.consoleId
      );

      const tempRaGame = {
        ...ragame,
        consoleId: raConsole?.igdbIds || null,
      };

      const igame = igames?.find(
        (game) =>
          !!tempRaGame.consoleId &&
          game.platforms.some((id: number) => tempRaGame.consoleId.includes(id))
      );

      if (!igame) {
        result.push(ragame);
      }

      return result;
    }, []);

    return unrecognised;
  }
}
