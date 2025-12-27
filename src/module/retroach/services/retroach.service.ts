import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  buildAuthorization,
  GameList,
  getConsoleIds,
  getGameList,
} from "@retroachievements/api";
import { Model } from "mongoose";
import { updateOrInsertValues } from "src/shared/db";

import { Game, GameDocument } from "src/module/games/schemas/game.schema";
import {
  Platform,
  PlatformDocument,
} from "src/module/games/schemas/platform.schema";
import { RA_MAIN_USER_NAME } from "src/shared/constants";
import { getFormattedTitle } from "src/shared/utils";
import { RAConsole } from "../schemas/console.schema";
import { RAGame } from "../schemas/retroach.schema";

@Injectable()
export class RetroachievementsService {
  private readonly logger = new Logger(RetroachievementsService.name);
  constructor(
    @InjectModel(RAGame.name) private gameModel: Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: Model<RAConsole>,
    @InjectModel(Game.name)
    private games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private platforms: Model<PlatformDocument>
  ) {}
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  async parse(type: "consoles" | "games" | "both") {
    try {
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
    } catch (err) {
      this.logger.error(err, `Failed to parse: ${type}`);
      throw err;
    }
  }

  async parseRAGames() {
    try {
      const raGames = await this.gameModel.find();
      const platforms = await this.platforms.find();
      const games = await this.games.find().select("name platformIds");

      const gamesSorted = games.reduce(
        (
          result: {
            [key: string]: GameDocument[];
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
        const value = { gameId: ragame._id, consoleId: ragame.consoleId };
        const title = getFormattedTitle(ragame.title);
        const filteredGames: GameDocument[] = title.includes("|")
          ? gamesSorted[title.split("|")[0]] || gamesSorted[title.split("|")[1]]
          : gamesSorted[title];

        const parsedPlatforms = platforms.filter(
          (console) => console.raId === ragame.consoleId
        );

        if (!parsedPlatforms.length || !filteredGames || !filteredGames.length)
          return result;

        const game = filteredGames?.find(
          (game) =>
            !!parsedPlatforms &&
            game?.platformIds.some((id) =>
              parsedPlatforms.some(
                (plat) => plat._id.toString() === id.toString()
              )
            )
        );

        const id = game?._id?.toString();

        if (!!id) {
          !!result?.[id]?.length
            ? result[id].push(value)
            : (result[id] = [value]);
        }

        return result;
      }, {});

      console.log(Object.values(gameIds).flat().length);

      await this.games.bulkWrite(
        Object.keys(gameIds).map((key) => ({
          updateOne: {
            filter: {
              _id: key,
            },
            update: [
              {
                $set: {
                  retroachievements: {
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
    } catch (err) {
      this.logger.error(err, `Failed to parse ra games`);
      throw err;
    }
  }

  async getUnrecognised() {
    // const raConsoles = await this.consoleModel.find();
    // const raGames = await this.gameModel.find();
    // const IGDBGames = await this.IGDBGamesModel.find().select("name platforms");
    //
    // const IGDBGamesSorted = IGDBGames.reduce(
    //   (
    //     result: {
    //       [key: string]: { _id: number; name: string; platforms: number[] }[];
    //     },
    //     game
    //   ) => {
    //     const title = getFormattedTitle(game.name);
    //
    //     Array.isArray(result[title]) && !!result[title]?.length
    //       ? result[title].push(game)
    //       : (result[title] = [game]);
    //
    //     return result;
    //   },
    //   {}
    // );
    //
    // const unrecognised = raGames.reduce((result, ragame) => {
    //   const title = getFormattedTitle(ragame.title);
    //   const igames: { _id: number; name: string; platforms: number[] }[] =
    //     title.includes("|")
    //       ? IGDBGamesSorted[title.split("|")[0]] ||
    //         IGDBGamesSorted[title.split("|")[1]]
    //       : IGDBGamesSorted[title];
    //
    //   const raConsole = raConsoles.find(
    //     (console) => console._id === ragame.consoleId
    //   );
    //
    //   const tempRaGame = {
    //     ...ragame,
    //     consoleId: raConsole?.igdbIds || null,
    //   };
    //
    //   const igame = igames?.find(
    //     (game) =>
    //       !!tempRaGame.consoleId &&
    //       game.platforms.some((id: number) => tempRaGame.consoleId.includes(id))
    //   );
    //
    //   if (!igame) {
    //     result.push(ragame);
    //   }
    //
    //   return result;
    // }, []);
    //
    // return unrecognised;
  }
}
