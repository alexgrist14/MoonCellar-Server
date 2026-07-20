import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as fuzzysort from "fuzzysort";
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

const SEARCH_CANDIDATES_LIMIT = 1000;
const SEARCH_SCORE_THRESHOLD = 0.1;
const SEARCH_INDEX_TTL_MS = 10 * 60 * 1000;

const SORT_FIELD_MAP: Record<string, string> = {
  total_rating: "igdb.total_rating",
  total_rating_count: "igdb.total_rating_count",
  first_release: "first_release",
  name: "name",
  rating: "rating",
  createdAt: "createdAt",
};

const TRIM_IGDB_STAGE = {
  $addFields: {
    igdb: {
      $cond: [
        { $ifNull: ["$igdb", false] },
        { gameId: "$igdb.gameId", total_rating: "$igdb.total_rating" },
        "$$REMOVE",
      ],
    },
  },
};

type SearchIndexEntry = { _id: mongoose.Types.ObjectId; name: string };

@Injectable()
export class GamesService implements OnModuleInit {
  private readonly logger = new Logger(GamesService.name);
  private searchIndexCache: SearchIndexEntry[] | null = null;
  private searchIndexCachedAt = 0;
  private searchIndexRefreshPromise: Promise<SearchIndexEntry[]> | null = null;

  constructor(
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    private fileService: FileService
  ) {}

  onModuleInit() {
    this.getSearchIndex().catch((err) =>
      this.logger.error(err, "Failed to warm up search index")
    );
  }

  private async getSearchIndex(): Promise<SearchIndexEntry[]> {
    const isStale = Date.now() - this.searchIndexCachedAt > SEARCH_INDEX_TTL_MS;

    if (this.searchIndexCache && !isStale) {
      return this.searchIndexCache;
    }

    if (!this.searchIndexRefreshPromise) {
      this.searchIndexRefreshPromise = this.Games.find({
        _id: { $exists: true },
      })
        .select("_id name")
        .lean<SearchIndexEntry[]>()
        .then((docs) => {
          this.searchIndexCache = docs;
          this.searchIndexCachedAt = Date.now();
          this.searchIndexRefreshPromise = null;
          return docs;
        })
        .catch((err) => {
          this.searchIndexRefreshPromise = null;
          throw err;
        });
    }

    return this.searchIndexCache ?? this.searchIndexRefreshPromise;
  }

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
      throw err;
    }
  }

  async getGameBySlug({ slug }: IGetGameBySlugRequest) {
    try {
      const game = (
        await this.Games.aggregate([{ $match: { slug } }, TRIM_IGDB_STAGE])
      ).pop();

      if (!game) throw new NotFoundException(`Game not found: ${slug}`);

      return game;
    } catch (err) {
      this.logger.error(err, `Failed to get game by slug: ${slug}`);
      throw err;
    }
  }

  async getGameById({ _id }: IGetGameByIdRequest) {
    try {
      const game = (
        await this.Games.aggregate([{ $match: { _id } }, TRIM_IGDB_STAGE])
      ).pop();

      if (!game) throw new NotFoundException(`Game not found: ${_id}`);

      return game;
    } catch (err) {
      this.logger.error(err, `Failed to get game by id: ${_id}`);
      throw err;
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
        TRIM_IGDB_STAGE,
      ]);
    } catch (err) {
      this.logger.error(err, `Failed to get games by ids: ${dto._ids}`);
      throw err;
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
    sortBy,
    sortOrder = "desc",
  }: IGetGamesRequest) {
    try {
      const baseFilters = {
        isOnlyWithAchievements,
        selected,
        excluded,
        mode,
        company,
        years,
        excludeGames,
        rating,
        votes,
      };

      let searchedIds: mongoose.Types.ObjectId[] | undefined;

      if (search) {
        const candidates = await this.getSearchIndex();

        const matches = fuzzysort.go(search, candidates, {
          key: "name",
          limit: SEARCH_CANDIDATES_LIMIT,
          threshold: SEARCH_SCORE_THRESHOLD,
        });

        searchedIds = matches.map((match) => match.obj._id);

        if (!searchedIds.length) {
          return { results: [], total: 0 };
        }
      }

      const pagination = [{ $skip: (+page - 1) * +take }, { $limit: +take }];

      const sortField = sortBy ? SORT_FIELD_MAP[sortBy] : "igdb.total_rating_count";
      const sortDirection = sortOrder === "asc" ? 1 : -1;

      const games = await this.Games.aggregate([
        gamesFilters(baseFilters, searchedIds),
        ...(searchedIds
          ? [
              {
                $addFields: {
                  searchRank: { $indexOfArray: [searchedIds, "$_id"] },
                },
              },
              { $sort: { searchRank: 1 as const } },
            ]
          : [
              {
                $sort: {
                  [sortField]: sortDirection as 1 | -1,
                },
              },
            ]),
        {
          $facet: {
            results: [
              ...(isRandom ? [{ $sample: { size: +take } }] : pagination),
              ...(searchedIds ? [{ $unset: "searchRank" }] : []),
              TRIM_IGDB_STAGE,
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
      throw err;
    }
  }

  async addGame(data: IAddGameRequest) {
    try {
      const now = new Date().toISOString();

      return await this.Games.create({
        ...data,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      this.logger.error(err, `Failed to add game: ${JSON.stringify(data)}`);
      throw err;
    }
  }

  async updateGame(_id: mongoose.Types.ObjectId, data: IUpdateGameRequest) {
    try {
      const game = await this.Games.findOneAndUpdate(
        { _id },
        { ...data, updatedAt: new Date().toISOString() },
        { new: true }
      );

      if (!game) throw new NotFoundException(`Game not found: ${_id}`);

      return game;
    } catch (err) {
      this.logger.error(err, `Failed to update game: ${_id}`);
      throw err;
    }
  }

  async deleteGame(_id: mongoose.Types.ObjectId) {
    try {
      const game = await this.Games.findOneAndDelete({ _id });

      if (!game) throw new NotFoundException(`Game not found: ${_id}`);

      return game;
    } catch (err) {
      this.logger.error(err, `Failed to delete game: ${_id}`);
      throw err;
    }
  }

  async getTopRatedRandomGames() {
    try {
      const games = await this.Games.aggregate([
        {
          $match: {
            "igdb.total_rating": { $exists: true, $gt: 80 },
            "igdb.total_rating_count": { $exists: true, $gt: 100 },
          },
        },
        {
          $sample: { size: 3 },
        },
        TRIM_IGDB_STAGE,
      ]);

      return games;
    } catch (err) {
      this.logger.error(err, `Failed to get top rated random games`);
      throw err;
    }
  }

  async getUpcomingReleases() {
    try {
      const nowSeconds = Math.floor(Date.now() / 1000);

      const groups = await this.Games.aggregate([
        {
          $match: {
            first_release: { $gt: nowSeconds },
            cover: { $ne: null },
          },
        },
        { $sort: { "igdb.hypes": -1, first_release: 1 } },
        TRIM_IGDB_STAGE,
        {
          $addFields: {
            _releaseDate: {
              $toDate: { $multiply: ["$first_release", 1000] },
            },
          },
        },
        {
          $addFields: {
            _year: { $year: "$_releaseDate" },
            _quarter: {
              $ceil: { $divide: [{ $month: "$_releaseDate" }, 3] },
            },
          },
        },
        {
          $group: {
            _id: { year: "$_year", quarter: "$_quarter" },
            games: { $push: "$$ROOT" },
          },
        },
        { $sort: { "_id.year": 1, "_id.quarter": 1 } },
        { $limit: 4 },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            quarter: "$_id.quarter",
            label: {
              $concat: [
                "Q",
                { $toString: "$_id.quarter" },
                " ",
                { $toString: "$_id.year" },
              ],
            },
            games: {
              $map: {
                input: { $slice: ["$games", 12] },
                as: "game",
                in: {
                  $unsetField: {
                    field: "_releaseDate",
                    input: {
                      $unsetField: {
                        field: "_year",
                        input: {
                          $unsetField: { field: "_quarter", input: "$$game" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return groups;
    } catch (err) {
      this.logger.error(err, `Failed to get upcoming releases`);
      throw err;
    }
  }

  async getRecentReleases() {
    try {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const windowStart = nowSeconds - 45 * 86400;

      const games = await this.Games.aggregate([
        {
          $match: {
            first_release: { $gte: windowStart, $lte: nowSeconds },
            cover: { $ne: null },
          },
        },
        { $sort: { first_release: -1 } },
        { $limit: 18 },
        TRIM_IGDB_STAGE,
      ]);

      return games;
    } catch (err) {
      this.logger.error(err, `Failed to get recent releases`);
      throw err;
    }
  }

  async parseFieldsToJson() {
    try {
      this.logger.log("Started parsing common fields to json");

      const fieldsToParse: Record<string, string> = {
        modes: "modes",
        genres: "genres",
        keywords: "keywords",
        themes: "themes",
        franchises: "franchises",
        type: "type",
        companies: "companies.name",
      };

      const entries = await Promise.all(
        Object.entries(fieldsToParse).map(async ([key, field]) => {
          const values = await this.Games.distinct(field);
          return [key, values.filter(Boolean)] as const;
        })
      );

      const result = Object.fromEntries(entries);

      const uploaded = await this.fileService.uploadObject(
        JSON.stringify(result),
        "filters",
        "mooncellar-common"
      );

      this.logger.log("Finished parsing common fields to json");

      return uploaded;
    } catch (err) {
      this.logger.error(err, `Failed to parse fields to json`);
      throw err;
    }
  }

  async getTotalGamesCountByGenre() {
    try {
      const result = (await this.Games.aggregate([
        {
          $match: {
            genres: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: "$genres",
        },
        {
          $group: {
            _id: "$genres",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $project: {
            _id: 0,
            genre: "$_id",
            count: 1,
          },
        },
      ])) as unknown as { genre: string; count: number }[];

      return result;
    } catch (err) {
      this.logger.error(err, `Failed to get total games count by genre`);
      throw err;
    }
  }
}
