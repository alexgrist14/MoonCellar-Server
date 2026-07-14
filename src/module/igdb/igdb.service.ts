import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  buildIgdbQueryParams,
  getLink,
  getMaxUpdatedAt,
  igdbAgent,
  igdbAuth,
  igdbParser,
  runWithConcurrency,
  wait,
} from "./utils/igdb";
import { ParserType } from "./interface/common.interface";
import { getImageLink } from "src/shared/utils";
import { Game, GameDocument } from "../games/schemas/game.schema";
import { Platform, PlatformDocument } from "../games/schemas/platform.schema";
import { RAConsole } from "../retroach/schemas/console.schema";
import { FileService } from "../user/services/file-upload.service";
import { HttpService } from "@nestjs/axios";
import {
  SyncState,
  SyncStateDocument,
} from "../games/schemas/sync-state.schema";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { runInCronLogContext } from "src/shared/cron-logging";
import {
  IGDB_GAMES_SYNC_CRON,
  IGDB_GAMES_SYNC_CRON_OPTIONS,
  IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY,
  IGDB_GAMES_SYNC_UPDATED_DELAY_MS,
  IGDB_GAMES_SYNC_UPDATED_LIMIT,
} from "./constants/sync";

const DEFAULT_IGDB_SYNC_LIMIT = 100;
const DEFAULT_IGDB_SYNC_DELAY_MS = 1000;
const DEFAULT_GAMES_SYNC_CONCURRENCY = 5;
const IGDB_BATCH_LIMIT = 500;

const SINGLE_GAME_QUERY_FIELDS = [
  "name",
  "slug",
  "category",
  "storyline",
  "summary",
  "first_release_date",
  "total_rating",
  "total_rating_count",
  "updated_at",
  "cover.id",
  "cover.url",
  "screenshots.id",
  "screenshots.url",
  "artworks.id",
  "artworks.url",
  "genres.id",
  "genres.name",
  "keywords.id",
  "keywords.name",
  "themes.id",
  "themes.name",
  "game_modes.id",
  "game_modes.name",
  "websites.id",
  "websites.url",
  "platforms",
  "game_type.id",
  "game_type.type",
  "involved_companies.id",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.porting",
  "involved_companies.supporting",
  "release_dates.id",
  "release_dates.date",
  "release_dates.human",
  "release_dates.m",
  "release_dates.y",
  "release_dates.platform",
  "release_dates.region",
].join(", ");

interface IGDBExpandedGame {
  id: number;
  name: string;
  slug: string;
  category?: number;
  storyline?: string;
  summary?: string;
  first_release_date?: number;
  total_rating?: number;
  total_rating_count?: number;
  updated_at?: number;
  cover?: { id: number; url: string };
  screenshots?: { id: number; url: string }[];
  artworks?: { id: number; url: string }[];
  genres?: { id: number; name: string }[];
  keywords?: { id: number; name: string }[];
  themes?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  websites?: { id: number; url: string }[];
  platforms?: number[];
  game_type?: { id: number; type: string };
  involved_companies?: {
    id: number;
    company?: { name: string };
    developer: boolean;
    publisher: boolean;
    porting: boolean;
    supporting: boolean;
  }[];
  release_dates?: {
    id: number;
    date: number;
    human: string;
    m: number;
    y: number;
    platform: number;
    region: number;
  }[];
}

const PLATFORM_QUERY_FIELDS = [
  "name",
  "slug",
  "generation",
  "created_at",
  "platform_family.name",
  "platform_family.slug",
  "platform_logo.url",
].join(", ");

interface IGDBExpandedPlatform {
  id: number;
  name: string;
  slug: string;
  generation?: number;
  created_at?: number;
  platform_family?: { name: string; slug: string };
  platform_logo?: { url: string };
}

@Injectable()
export class IGDBService {
  private readonly logger = new Logger(IGDBService.name);
  private isSyncUpdatedGamesCronRunning = false;
  constructor(
    @InjectModel(SyncState.name)
    private SyncStateModel: Model<SyncStateDocument>,
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    @InjectModel(RAConsole.name)
    private RAPlatforms: Model<RAConsole>,
    private fileService: FileService,
    private httpService: HttpService,
    private readonly pino: PinoLogger
  ) {}

  private async getSyncCheckpoint(type: ParserType) {
    const state = await this.SyncStateModel.findOne({
      parserType: type,
    }).lean();

    return state?.lastUpdatedAt || 0;
  }

  private async getGamesSyncState() {
    return this.SyncStateModel.findOne({
      parserType: "games",
    }).lean();
  }

  private async markGamesBackfillStarted() {
    const now = new Date().toISOString();

    return this.SyncStateModel.findOneAndUpdate(
      { parserType: "games" },
      {
        $set: {
          backfillCompleted: false,
          lastRunAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          backfillUpdatedAt: 0,
          lastUpdatedAt: 0,
        },
      },
      { new: true, upsert: true }
    );
  }

  private async setGamesBackfillProgress(backfillUpdatedAt: number) {
    const now = new Date().toISOString();

    return this.SyncStateModel.findOneAndUpdate(
      { parserType: "games" },
      {
        $set: {
          backfillUpdatedAt,
          lastRunAt: now,
          updatedAt: now,
        },
      },
      { new: true, upsert: true }
    );
  }

  private async markGamesBackfillCompleted(lastUpdatedAt: number) {
    const now = new Date().toISOString();

    return this.SyncStateModel.findOneAndUpdate(
      { parserType: "games" },
      {
        $set: {
          backfillCompleted: true,
          backfillUpdatedAt: lastUpdatedAt,
          lastUpdatedAt,
          lastRunAt: now,
          updatedAt: now,
        },
      },
      { new: true, upsert: true }
    );
  }

  private async setSyncCheckpoint(type: ParserType, lastUpdatedAt: number) {
    const now = new Date().toISOString();

    return this.SyncStateModel.findOneAndUpdate(
      { parserType: type },
      {
        $set: {
          lastUpdatedAt,
          lastRunAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { new: true, upsert: true }
    );
  }

  async getToken() {
    const { data: authData } = await igdbAuth();
    return authData;
  }

  async backfillGamesFromIgdb(options?: {
    limit?: number;
    delayMs?: number;
    concurrency?: number;
  }) {
    try {
      const token = await this.getIgdbToken();

      let processedCount = 0;
      let checkpoint = 0;

      await this.markGamesBackfillStarted();

      await igdbParser<IGDBExpandedGame>({
        token,
        action: "games",
        options: {
          limit: options?.limit || DEFAULT_IGDB_SYNC_LIMIT,
          delayMs: options?.delayMs ?? DEFAULT_IGDB_SYNC_DELAY_MS,
          sort: "updated_at asc",
          fields: SINGLE_GAME_QUERY_FIELDS,
          isCollectItems: false,
        },
        parsingCallback: async (items) => {
          const existingGames = await this.Games.find({
            "igdb.gameId": { $in: items.map((item) => item.id) },
          }).select("_id slug type createdAt igdb");

          const existingGamesByIgdbId = new Map(
            existingGames.map((game) => [game.igdb.gameId, game])
          );

          await runWithConcurrency(
            items,
            options?.concurrency || DEFAULT_GAMES_SYNC_CONCURRENCY,
            async (igdbGame) => {
              try {
                await this.upsertGameFromIgdb(
                  igdbGame,
                  existingGamesByIgdbId.get(igdbGame.id)
                );
                processedCount++;
              } catch (e) {
                this.logger.error(
                  e,
                  `Failed to upsert game from IGDB during backfill: ${igdbGame.id}`
                );
              }
            }
          );

          checkpoint = getMaxUpdatedAt(items, checkpoint);
          await this.setGamesBackfillProgress(checkpoint);
        },
      });

      await this.markGamesBackfillCompleted(checkpoint);

      return {
        processedCount,
        lastUpdatedAt: checkpoint,
      };
    } catch (err) {
      this.logger.error(err, `Failed to backfill games from IGDB`);
      throw err;
    }
  }

  async backfillUpcomingHypes(options?: { limit?: number; delayMs?: number }) {
    try {
      const { data: authData } = await igdbAuth();
      const { access_token: token } = authData;

      if (!token) {
        this.logger.warn(`There is no token to backfill hypes`);
        return;
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const where = `first_release_date > ${nowSeconds} & hypes != null`;
      const limit = options?.limit || 500;
      const delayMs = options?.delayMs ?? 0;
      const url = "https://api.igdb.com/v4/games";

      const { data: countData } = await igdbAgent<{ count: number }>(
        `${url}/count`,
        token,
        buildIgdbQueryParams(undefined, { where })
      );
      const total = countData.count;

      let offset = 0;
      let matched = 0;
      let modified = 0;

      while (offset < total) {
        const { data } = await igdbAgent<{ id: number; hypes: number }[]>(
          url,
          token,
          buildIgdbQueryParams("id, hypes", {
            where,
            sort: "hypes desc",
            limit,
            offset,
          })
        );

        if (!data?.length) {
          break;
        }

        const ops = data
          .filter((item) => typeof item.hypes === "number")
          .map((item) => ({
            updateOne: {
              filter: { "igdb.gameId": item.id },
              update: { $set: { "igdb.hypes": item.hypes } },
            },
          }));

        if (ops.length) {
          const res = await this.Games.bulkWrite(ops);
          matched += res.matchedCount;
          modified += res.modifiedCount;
        }

        offset += limit;

        if (delayMs) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return { total, matched, modified };
    } catch (err) {
      this.logger.error(err, `Failed to backfill upcoming hypes`);
      throw err;
    }
  }

  async syncGamesFromIgdb(options?: {
    limit?: number;
    delayMs?: number;
    concurrency?: number;
  }) {
    try {
      const token = await this.getIgdbToken();

      const state = await this.getGamesSyncState();
      if (!state?.backfillCompleted) {
        throw new BadRequestException(
          "IGDB games backfill must complete before sync can run"
        );
      }

      let checkpoint = await this.getSyncCheckpoint("games");
      let changedCount = 0;

      await igdbParser<IGDBExpandedGame>({
        token,
        action: "games",
        options: {
          limit: options?.limit || DEFAULT_IGDB_SYNC_LIMIT,
          delayMs: options?.delayMs ?? DEFAULT_IGDB_SYNC_DELAY_MS,
          where: `updated_at > ${checkpoint}`,
          sort: "updated_at asc",
          fields: SINGLE_GAME_QUERY_FIELDS,
          isCollectItems: false,
        },
        parsingCallback: async (items) => {
          const existingGames = await this.Games.find({
            "igdb.gameId": { $in: items.map((item) => item.id) },
          }).select("_id slug type createdAt igdb");

          const existingGamesByIgdbId = new Map(
            existingGames.map((game) => [game.igdb.gameId, game])
          );

          await runWithConcurrency(
            items,
            options?.concurrency || DEFAULT_GAMES_SYNC_CONCURRENCY,
            async (igdbGame) => {
              try {
                await this.upsertGameFromIgdb(
                  igdbGame,
                  existingGamesByIgdbId.get(igdbGame.id)
                );
                changedCount++;
              } catch (e) {
                this.logger.error(
                  e,
                  `Failed to upsert game from IGDB: ${igdbGame.id}`
                );
              }
            }
          );

          checkpoint = getMaxUpdatedAt(items, checkpoint);
          await this.setSyncCheckpoint("games", checkpoint);
        },
      });

      return { changedCount, lastUpdatedAt: checkpoint };
    } catch (err) {
      this.logger.error(err, "Failed to sync games from IGDB");
      throw err;
    }
  }

  @Cron(IGDB_GAMES_SYNC_CRON, IGDB_GAMES_SYNC_CRON_OPTIONS)
  async syncUpdatedGamesCron() {
    return runInCronLogContext(this.pino, "igdb-games-sync", () =>
      this.runSyncUpdatedGamesCron()
    );
  }

  private async runSyncUpdatedGamesCron() {
    if (this.isSyncUpdatedGamesCronRunning) {
      this.logger.warn("IGDB games sync cron is already running");
      return;
    }

    this.isSyncUpdatedGamesCronRunning = true;

    try {
      const result = await this.syncGamesFromIgdb({
        limit: IGDB_GAMES_SYNC_UPDATED_LIMIT,
        delayMs: IGDB_GAMES_SYNC_UPDATED_DELAY_MS,
        concurrency: IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY,
      });

      if (!result?.changedCount) {
        this.logger.log("IGDB games sync cron finished without changes");
        return result;
      }

      this.logger.log(
        `IGDB games sync cron finished with ${result.changedCount} changes`
      );

      return result;
    } catch (err) {
      this.logger.error(err, "Failed to run IGDB games sync cron");
      throw err;
    } finally {
      this.isSyncUpdatedGamesCronRunning = false;
    }
  }

  private buildParseImagesFilter(
    parseType: "covers" | "screenshots" | "artworks",
    isForceParse?: boolean
  ): mongoose.FilterQuery<GameDocument> {
    const baseFilter: mongoose.FilterQuery<GameDocument> = {
      "igdb.gameId": { $exists: true },
    };

    if (isForceParse) return baseFilter;

    if (parseType === "covers") {
      return {
        ...baseFilter,
        $or: [{ cover: null }, { cover: "" }, { cover: { $exists: false } }],
      };
    }

    if (parseType === "screenshots") {
      return {
        ...baseFilter,
        $expr: {
          $ne: [
            { $size: { $ifNull: ["$screenshots", []] } },
            { $ifNull: ["$igdb.screenshotsCount", 0] },
          ],
        },
      };
    }

    return {
      ...baseFilter,
      $expr: {
        $ne: [
          { $size: { $ifNull: ["$artworks", []] } },
          { $ifNull: ["$igdb.artworksCount", 0] },
        ],
      },
    };
  }

  async getImagesToParseCount(options: {
    parseType: "covers" | "screenshots" | "artworks";
    isForceParse?: boolean;
  }) {
    return this.Games.countDocuments(
      this.buildParseImagesFilter(options.parseType, options.isForceParse)
    );
  }

  private shouldParseImages(
    mooncellarGame: Pick<
      GameDocument,
      "cover" | "screenshots" | "artworks" | "igdb"
    >,
    parseType: "covers" | "screenshots" | "artworks"
  ): boolean {
    if (parseType === "covers") {
      return !mooncellarGame.cover;
    }

    if (parseType === "screenshots") {
      return (
        (mooncellarGame.screenshots?.length || 0) !==
        (mooncellarGame.igdb?.screenshotsCount || 0)
      );
    }

    return (
      (mooncellarGame.artworks?.length || 0) !==
      (mooncellarGame.igdb?.artworksCount || 0)
    );
  }

  private async sendArrayToS3(
    bucketName: string,
    slug: string,
    images: ({ url: string } | string)[]
  ) {
    const links: string[] = [];

    for (const i in images) {
      try {
        const _id = new mongoose.Types.ObjectId();
        if (!images?.[i]) continue;

        const url =
          typeof images[i] === "string"
            ? images[i]
            : getImageLink(images[i]?.url, "1080p");

        if (!url) continue;

        const response = await this.httpService.axiosRef({
          url,
          method: "GET",
          responseType: "arraybuffer",
        });

        if (!response.data.length) {
          this.logger.error("Image not found: " + url);
          continue;
        }

        const key = `${slug}/${_id}`;
        await this.fileService.uploadFile(
          response.data,
          key,
          bucketName,
          "image/jpeg"
        );

        links.push(
          process.env.S3_HOST_CDN.replace("%backet", bucketName) + key + ".jpg"
        );
      } catch (e) {
        this.logger.error(
          "Image error: " +
            (e?.response?.status || e?.err?.message || "unknown")
        );
        return Promise.reject();
      }
    }

    return links;
  }

  private async clearExistingImages(bucketName: string, slug: string) {
    const existingKeys = await this.fileService.getAllKeys(bucketName, {
      prefix: slug + "/",
    });

    if (existingKeys.length) {
      await this.fileService.deleteFiles(existingKeys, bucketName);
    }
  }

  private async fetchGameImagesFromIgdb(igdbGameId: number, token: string) {
    const { data } = await igdbAgent<
      {
        id: number;
        cover?: { url: string };
        screenshots?: { url: string }[];
        artworks?: { url: string }[];
      }[]
    >(
      getLink("games"),
      token,
      buildIgdbQueryParams("cover.url, screenshots.url, artworks.url", {
        where: `id = ${igdbGameId}`,
        limit: 1,
      })
    );

    return data?.[0];
  }

  private async parseSingleGameImages(
    mooncellarGame: Pick<
      GameDocument,
      "_id" | "slug" | "cover" | "screenshots" | "artworks" | "igdb"
    >,
    token: string,
    options: {
      parseType: "covers" | "screenshots" | "artworks";
      isForceParse?: boolean;
    }
  ) {
    if (
      !options.isForceParse &&
      !this.shouldParseImages(mooncellarGame, options.parseType)
    ) {
      return mooncellarGame.slug + " skipped";
    }

    if (!mooncellarGame.igdb?.gameId) {
      this.logger.warn(`Game has no linked IGDB id: ${mooncellarGame.slug}`);
      return null;
    }

    const igdbGame = await this.fetchGameImagesFromIgdb(
      mooncellarGame.igdb.gameId,
      token
    );

    if (!igdbGame) {
      this.logger.warn(
        `No matching IGDB game for: ${mooncellarGame.slug} (igdb.gameId: ${mooncellarGame.igdb.gameId})`
      );
      return null;
    }

    if (options.parseType === "covers") {
      await this.clearExistingImages("mooncellar-covers", mooncellarGame.slug);

      const coverLink = !!igdbGame.cover?.url
        ? getImageLink(igdbGame.cover.url, "cover_big", 2)
        : undefined;
      const [link] = await this.sendArrayToS3(
        "mooncellar-covers",
        mooncellarGame.slug,
        [coverLink]
      );

      if (link) {
        await this.Games.updateOne(
          { _id: mooncellarGame._id },
          { $set: { cover: link } }
        );
      }
    }

    if (options.parseType === "screenshots") {
      await this.clearExistingImages(
        "mooncellar-screenshots",
        mooncellarGame.slug
      );

      const links = await this.sendArrayToS3(
        "mooncellar-screenshots",
        mooncellarGame.slug,
        igdbGame.screenshots || []
      );

      await this.Games.updateOne(
        { _id: mooncellarGame._id },
        { $set: { screenshots: links } }
      );
    }

    if (options.parseType === "artworks") {
      await this.clearExistingImages(
        "mooncellar-artworks",
        mooncellarGame.slug
      );

      const links = await this.sendArrayToS3(
        "mooncellar-artworks",
        mooncellarGame.slug,
        igdbGame.artworks || []
      );

      await this.Games.updateOne(
        { _id: mooncellarGame._id },
        { $set: { artworks: links } }
      );
    }

    return mooncellarGame.slug + " parsed";
  }

  async parseImagesToS3(
    page: number,
    limit: number,
    options?: {
      parseType: "covers" | "screenshots" | "artworks";
      isForceParse?: boolean;
    }
  ) {
    try {
      const mooncellarGames = await this.Games.find(
        this.buildParseImagesFilter(options?.parseType, options?.isForceParse)
      )
        .select("_id slug cover screenshots artworks igdb")
        .skip((page - 1) * limit)
        .limit(limit);

      this.logger.log(
        `Parsing started: ${mooncellarGames.length} games matched`
      );

      const token = await this.getIgdbToken();

      const queries = mooncellarGames.filter(Boolean).map(
        (mooncellarGame) =>
          new Promise((resolve, reject) => {
            this.parseSingleGameImages(mooncellarGame, token, {
              parseType: options?.parseType,
              isForceParse: options?.isForceParse,
            })
              .then((res) => resolve(res))
              .catch((e) => {
                this.logger.error(
                  e,
                  `Failed to parse images for game: ${mooncellarGame.slug}`
                );
                reject();
              });
          })
      );

      return Promise.allSettled(queries);
    } catch (err) {
      this.logger.error(err, `Failed to parse images to s3`);
      throw err;
    }
  }

  async parseImagesForGame(
    identifier: { slug?: string; id?: string },
    options: {
      parseType: "covers" | "screenshots" | "artworks";
      isForceParse?: boolean;
    }
  ) {
    try {
      const filter: mongoose.FilterQuery<GameDocument> = identifier.id
        ? { _id: identifier.id }
        : { slug: identifier.slug };

      const mooncellarGame = await this.Games.findOne(filter).select(
        "_id slug cover screenshots artworks igdb"
      );

      if (!mooncellarGame) {
        throw new NotFoundException(
          `Game not found: ${identifier.slug || identifier.id}`
        );
      }

      const token = await this.getIgdbToken();

      return this.parseSingleGameImages(mooncellarGame, token, options);
    } catch (err) {
      this.logger.error(
        err,
        `Failed to parse images for game: ${identifier.slug || identifier.id}`
      );
      throw err;
    }
  }

  private async upsertPlatformFromIgdb(platform: IGDBExpandedPlatform) {
    const ra = await this.RAPlatforms.findOne({ igdbIds: platform.id });
    const now = new Date().toISOString();

    await this.Platforms.updateOne(
      { igdbId: platform.id },
      {
        $set: {
          name: platform.name,
          slug: platform.slug,
          generation: platform.generation || null,
          ...(!!platform.platform_family && {
            family: {
              name: platform.platform_family.name,
              slug: platform.platform_family.slug,
            },
          }),
          ...(!!platform.platform_logo && {
            logo: getImageLink(platform.platform_logo.url, "thumb"),
          }),
          igdbId: platform.id,
          raId: ra?._id || null,
          updateAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  }

  async parsePlatformsFromIgdb() {
    try {
      const token = await this.getIgdbToken();
      let count = 0;

      await igdbParser<IGDBExpandedPlatform>({
        token,
        action: "platforms",
        options: {
          fields: PLATFORM_QUERY_FIELDS,
          isCollectItems: false,
        },
        parsingCallback: async (items) => {
          for (const platform of items) {
            try {
              await this.upsertPlatformFromIgdb(platform);
              count++;
            } catch (e) {
              this.logger.error(
                e,
                `Failed to upsert platform from IGDB: ${platform.id}`
              );
            }
          }
        },
      });

      this.logger.log(`Parsed ${count} platforms from IGDB`);

      return "Completed";
    } catch (err) {
      this.logger.error(err, `Failed to parse platforms from IGDB`);
      throw err;
    }
  }

  private async getIgdbToken() {
    const { data: authData } = await igdbAuth();
    const { access_token: token } = authData;

    if (!token) {
      throw new BadRequestException("There is no token to parse from IGDB");
    }

    return token;
  }

  private async parseSingleGameFromIgdb(
    igdbGameId: number,
    token: string,
    existingGame?: Pick<GameDocument, "_id" | "slug" | "type" | "createdAt">
  ) {
    const { data } = await igdbAgent<IGDBExpandedGame[]>(
      getLink("games"),
      token,
      buildIgdbQueryParams(SINGLE_GAME_QUERY_FIELDS, {
        where: `id = ${igdbGameId}`,
        limit: 1,
      })
    );

    const igdbGame = data?.[0];

    if (!igdbGame) {
      throw new NotFoundException(`IGDB game not found for id: ${igdbGameId}`);
    }

    return this.upsertGameFromIgdb(igdbGame, existingGame);
  }

  private async upsertGameFromIgdb(
    igdbGame: IGDBExpandedGame,
    existingGame?: Pick<GameDocument, "_id" | "slug" | "type" | "createdAt">
  ) {
    const platformIds = await this.Platforms.find({
      igdbId: { $in: igdbGame.platforms || [] },
    }).select("_id igdbId");

    const now = new Date().toISOString();

    const update = {
      slug: igdbGame.slug,
      name: igdbGame.name,
      type:
        igdbGame.game_type?.type ||
        igdbGame.category ||
        existingGame?.type ||
        null,
      storyline: igdbGame.storyline,
      summary: igdbGame.summary,
      modes: (igdbGame.game_modes || []).map((mode) => mode.name),
      genres: (igdbGame.genres || []).map((genre) => genre.name),
      keywords: (igdbGame.keywords || []).map((keyword) => keyword.name),
      themes: (igdbGame.themes || []).map((theme) => theme.name),
      companies: (igdbGame.involved_companies || []).map((comp) => ({
        name: comp.company?.name,
        developer: comp.developer,
        publisher: comp.publisher,
        porting: comp.porting,
        supporting: comp.supporting,
      })),
      websites: (igdbGame.websites || []).map((site) => site.url),
      first_release: igdbGame.first_release_date,
      release_dates: (igdbGame.release_dates || []).map((date) => ({
        date: date.date,
        human: date.human,
        month: date.m,
        year: date.y,
        platformId: platformIds.find((plat) => plat.igdbId === date.platform)
          ?._id,
        region: date.region,
      })),
      platformIds: platformIds.map((plat) => plat._id),
      igdb: {
        gameId: igdbGame.id,
        total_rating: igdbGame.total_rating,
        total_rating_count: igdbGame.total_rating_count,
        screenshotsCount: igdbGame.screenshots?.length || 0,
        artworksCount: igdbGame.artworks?.length || 0,
        genres: (igdbGame.genres || []).map((genre) => genre.id),
        keywords: (igdbGame.keywords || []).map((keyword) => keyword.id),
        themes: (igdbGame.themes || []).map((theme) => theme.id),
        modes: (igdbGame.game_modes || []).map((mode) => mode.id),
        websites: (igdbGame.websites || []).map((site) => site.id),
        release_dates: (igdbGame.release_dates || []).map((date) => date.id),
        platforms: igdbGame.platforms || [],
        involved_companies: (igdbGame.involved_companies || []).map(
          (comp) => comp.id
        ),
        game_type: igdbGame.game_type?.id,
        cover: igdbGame.cover ? [igdbGame.cover.id] : [],
        screenshots: (igdbGame.screenshots || []).map((s) => s.id),
        artworks: (igdbGame.artworks || []).map((a) => a.id),
      },
      createdAt: existingGame?.createdAt || now,
      updatedAt: now,
    };

    await this.Games.updateOne(
      { "igdb.gameId": igdbGame.id },
      { $set: update },
      { upsert: true }
    );

    this.logger.log(`Parsed game from IGDB: ${update.slug}`);

    return update.slug + " parsed";
  }

  async parseGameFromIgdb(identifier: { slug?: string; id?: string }) {
    try {
      const filter: mongoose.FilterQuery<GameDocument> = identifier.id
        ? { _id: identifier.id }
        : { slug: identifier.slug };

      const existingGame = await this.Games.findOne(filter);

      if (!existingGame) {
        throw new NotFoundException(
          `Game not found: ${identifier.slug || identifier.id}`
        );
      }

      if (!existingGame.igdb?.gameId) {
        throw new BadRequestException(
          `Game has no linked IGDB id: ${existingGame.slug}`
        );
      }

      const token = await this.getIgdbToken();

      return await this.parseSingleGameFromIgdb(
        existingGame.igdb.gameId,
        token,
        existingGame
      );
    } catch (err) {
      this.logger.error(
        err,
        `Failed to parse game from IGDB: ${identifier.slug || identifier.id}`
      );
      throw err;
    }
  }

  async getLinkedGamesCount() {
    return this.Games.countDocuments({ "igdb.gameId": { $exists: true } });
  }

  async parseAllGamesFromIgdb(
    page: number,
    limit: number,
    options?: { concurrency?: number; delayMs?: number }
  ) {
    try {
      const linkedGames = await this.Games.find({
        "igdb.gameId": { $exists: true },
      })
        .select("_id slug type createdAt igdb")
        .skip((page - 1) * limit)
        .limit(limit);

      if (!linkedGames.length) {
        return [];
      }

      this.logger.log(
        `Parsing games from IGDB started: ${linkedGames.length} games`
      );

      const token = await this.getIgdbToken();

      const existingGamesByIgdbId = new Map(
        linkedGames.map((game) => [game.igdb.gameId, game])
      );
      const igdbGameIds = linkedGames.map((game) => game.igdb.gameId);

      const igdbGames: IGDBExpandedGame[] = [];
      for (let i = 0; i < igdbGameIds.length; i += IGDB_BATCH_LIMIT) {
        const batch = igdbGameIds.slice(i, i + IGDB_BATCH_LIMIT);
        const { data } = await igdbAgent<IGDBExpandedGame[]>(
          getLink("games"),
          token,
          buildIgdbQueryParams(SINGLE_GAME_QUERY_FIELDS, {
            where: `id = (${batch.join(",")})`,
            limit: batch.length,
          })
        );

        igdbGames.push(...data);
      }

      const results = await runWithConcurrency(
        igdbGames,
        options?.concurrency || DEFAULT_GAMES_SYNC_CONCURRENCY,
        async (igdbGame) => {
          try {
            return await this.upsertGameFromIgdb(
              igdbGame,
              existingGamesByIgdbId.get(igdbGame.id)
            );
          } catch (e) {
            this.logger.error(
              e,
              `Failed to parse game from IGDB: ${igdbGame.id}`
            );
            return null;
          }
        }
      );

      if (options?.delayMs) {
        await wait(options.delayMs);
      }

      const parsedCount = results.filter(Boolean).length;
      this.logger.log(
        `Parsing games from IGDB finished: ${parsedCount}/${linkedGames.length} games parsed on page ${page}`
      );

      return results;
    } catch (err) {
      this.logger.error(err, `Failed to parse games from IGDB`);
      throw err;
    }
  }
}
