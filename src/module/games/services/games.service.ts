import { Injectable, Logger, NotFoundException } from "@nestjs/common";
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
  private readonly logger = new Logger(GamesService.name);
  constructor(
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    private fileService: FileService
  ) {}

  async uploadImage(
    gameId: mongoose.Types.ObjectId,
    image: Express.Multer.File,
    type: "cover" | "screenshot" | "artwork"
  ) {
    try {
      const game = await this.Games.findOne({
        _id: new mongoose.Types.ObjectId(gameId),
      });
      if (!game) throw new NotFoundException("Game not found");
      const _id = new mongoose.Types.ObjectId();

      await this.fileService.uploadFile(
        image,
        gameId.toString() + "/" + _id.toString(),
        "mooncellar-" + type + "s"
      );

      return (
        `https://mooncellar-${type}s.s3.regru.cloud/` +
        gameId.toString() +
        "/" +
        _id.toString()
      );
    } catch (err) {
      this.logger.error(err, `Failed to upload image for game: ${gameId}`);
      throw new err();
    }
  }

  async getGameBySlug({ slug }: IGetGameBySlugRequest) {
    try {
      const game = this.Games.aggregate([{ $match: { slug } }]);

      return (await game).pop();
    } catch (err) {
      this.logger.error(err, `Failed to get game by slug: ${slug}`);
      throw new err();
    }
  }

  async getGameById({ _id }: IGetGameByIdRequest) {
    try {
      const game = this.Games.aggregate([{ $match: { _id } }]);

      return (await game).pop();
    } catch (err) {
      this.logger.error(err, `Failed to get game by id: ${_id}`);
      throw new err();
    }
  }

  async getGamesByIds(dto: IGetGamesByIdsRequest) {
    if (!dto._ids?.length) {
      return [];
    }

    try {
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
    } catch (err) {
      this.logger.error(err, `Failed to get games by ids: ${dto._ids}`);
      throw new err();
    }
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
    rating,
    votes,
    excludeGames,
  }: IGetGamesRequest) {
    try {
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
          rating,
          votes,
        }),
        {
          $sort: {
            "igdb.total_rating_count": -1,
          },
        },
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
    } catch (err) {
      this.logger.error(err, `Failed to get games`);
      throw new err();
    }
  }

  async addGame(data: IAddGameRequest) {
    try {
      return this.Games.create(data);
    } catch (err) {
      this.logger.error(err, `Failed to add game: ${JSON.stringify(data)}`);
      throw new err();
    }
  }

  async updateGame(_id: mongoose.Types.ObjectId, data: IUpdateGameRequest) {
    try {
      return this.Games.findOneAndUpdate(
        { _id },
        { ...data, updatedAt: new Date().toISOString() },
        {
          new: true,
        }
      );
    } catch (err) {
      this.logger.error(err, `Failed to update game: ${_id}`);
      throw new err();
    }
  }

  async deleteGame(_id: mongoose.Types.ObjectId) {
    try {
      return this.Games.findOneAndDelete({ _id });
    } catch (err) {
      this.logger.error(err, `Failed to delete game: ${_id}`);
      throw new err();
    }
  }

  async parseFieldsToJson() {
    try {
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
    } catch (err) {
      this.logger.error(err, `Failed to parse fields to json`);
      throw new err();
    }
  }
}
