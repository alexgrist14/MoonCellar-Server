import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  IAddGameRequest,
  IGetGameByIdRequest,
  IGetGameBySlugRequest,
  IGetGamesByIdsRequest,
  IGetGamesRequest,
  IUpdateGameRequest,
} from "src/shared/zod/schemas/games.schema";
import { Game, GameDocument } from "../schemas/game.schema";
import { gamesFilters } from "src/shared/games";
import { FileService } from "src/module/user/services/file-upload.service";

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    private fileService: FileService
  ) {}

  async getGameBySlug({ slug }: IGetGameBySlugRequest) {
    const game = this.Games.aggregate([{ $match: { slug } }]);

    return (await game).pop();
  }

  async getGameById({ _id }: IGetGameByIdRequest) {
    const game = this.Games.aggregate([{ $match: { _id } }]);

    return (await game).pop();
  }

  async getGamesByIds(dto: IGetGamesByIdsRequest) {
    return await this.Games.aggregate([
      {
        $match: {
          _id: {
            $in: Array.isArray(dto._ids)
              ? dto._ids.map((id) => new mongoose.Types.ObjectId(id))
              : [new mongoose.Types.ObjectId(dto._ids)],
          },
        },
      },
    ]);
  }

  async getGames({
    take = 50,
    isRandom = false,
    isOnlyWithAchievements = false,
    page = 1,
    selected,
    excluded,
    search,
    mode = "any",
    company,
    years,
    excludeGames,
  }: IGetGamesRequest) {
    const pagination = [{ $skip: (+page - 1) * +take }, { $limit: +take }];

    const games = await this.Games.aggregate([
      gamesFilters({
        isOnlyWithAchievements,
        selected,
        excluded,
        search,
        mode,
        company,
        years,
        excludeGames,
      }),
      { $sort: { first_release: -1 } },
      {
        $facet: {
          results: [
            ...(isRandom ? [{ $sample: { size: +take } }] : pagination),
          ],
          totalCount: [{ $count: "count" }],
        },
      },
      {
        $addFields: {
          total: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
          },
        },
      },
      {
        $project: {
          results: 1,
          total: 1,
        },
      },
    ]);

    return games.pop();
  }

  async addGame(data: IAddGameRequest) {
    return this.Games.create(data);
  }

  async updateGame(_id: mongoose.Types.ObjectId, data: IUpdateGameRequest) {
    return this.Games.findOneAndUpdate(
      { _id },
      { ...data, updatedAt: new Date().toISOString() },
      {
        new: true,
      }
    );
  }

  async deleteGame(_id: mongoose.Types.ObjectId) {
    return this.Games.findOneAndDelete({ _id });
  }

  async parseFieldsToJson() {
    const games = await this.Games.find().select(
      "modes genres keywords themes companies type"
    );

    const result = {};

    for (const game of games) {
      const fieldsToParse = [
        "modes",
        "genres",
        "keywords",
        "themes",
        "companies",
        "type",
      ];

      for (const field of fieldsToParse) {
        const values =
          typeof game[field] === "string" ? [game[field]] : game[field];
        const parsedValues = values?.filter(
          (value: string) => !result[field]?.includes(value)
        );

        if (parsedValues?.length && game[field]) {
          !result[field]?.length
            ? (result[field] = parsedValues)
            : result[field].push(...parsedValues);
        }
      }
    }

    return this.fileService.uploadObject(
      JSON.stringify(result),
      "filters",
      "mooncellar-common"
    );
  }
}
