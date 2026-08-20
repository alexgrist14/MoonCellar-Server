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
  parseStoreNameFromUrl,
  runWithConcurrency,
} from "./utils/igdb";
import { ParserType } from "./interface/common.interface";
import { getImageLink, normalizeGameName } from "src/shared/utils";
import { findSteamAppInfo, mergeSteamStore } from "../steam/utils/steam.utils";
import { Game, GameDocument } from "../games/schemas/game.schema";
import { Platform, PlatformDocument } from "../games/schemas/platform.schema";
import { FileService } from "../user/services/file-upload.service";
import { HttpService } from "@nestjs/axios";
import {
  SyncState,
  SyncStateDocument,
} from "../games/schemas/sync-state.schema";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { runInCronLogContext } from "src/shared/cron-logging";
import { runCronExclusive } from "src/shared/cron-mutex";
import { BusinessMetricsService } from "src/module/metrics/business-metrics.service";
import {
  IGDB_GAMES_LINK_RELATED_CRON,
  IGDB_GAMES_LINK_RELATED_CRON_OPTIONS,
  IGDB_GAMES_SYNC_CRON,
  IGDB_GAMES_SYNC_CRON_OPTIONS,
  IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY,
  IGDB_GAMES_SYNC_UPDATED_DELAY_MS,
  IGDB_GAMES_SYNC_UPDATED_LIMIT,
} from "./constants/sync";
import {
  categoryTypeNames,
  externalGameSourceNames,
  gameStatusNames,
} from "./constants/common";
import {
  DEFAULT_GAMES_SYNC_CONCURRENCY,
  DEFAULT_IGDB_SYNC_DELAY_MS,
  DEFAULT_IGDB_SYNC_LIMIT,
  IMAGE_FIELDS,
  PLATFORM_QUERY_FIELDS,
  RELATED_GAMES_LINK_BATCH_SIZE,
  SINGLE_GAME_QUERY_FIELDS,
  UPDATABLE_GAME_FIELDS,
  UPDATABLE_PLATFORM_FIELDS,
} from "./constants/igdb";

type ImageField = (typeof IMAGE_FIELDS)[number];

const HYPES_FIELD = "hypes" as const;

const ALL_UPDATABLE_GAME_FIELDS = [
  ...UPDATABLE_GAME_FIELDS,
  ...IMAGE_FIELDS,
  HYPES_FIELD,
] as const;

const RELATED_GAME_ARRAY_FIELDS = [
  "dlcs",
  "expansions",
  "standalone_expansions",
  "bundles",
  "expanded_games",
  "forks",
  "ports",
  "remakes",
  "remasters",
  "similar_games",
] as const;

const mergeFranchises = (
  franchises?: { id: number; name: string }[],
  franchise?: { id: number; name: string },
  collections?: { id: number; name: string }[]
) => {
  const merged = [...(franchises || [])];
  if (franchise && !merged.some((f) => f.id === franchise.id)) {
    merged.push(franchise);
  }
  for (const collection of collections || []) {
    if (!merged.some((f) => f.name === collection.name)) {
      merged.push(collection);
    }
  }
  return merged;
};

const isFieldValueEmpty = (value: unknown) => {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.length === 0;
  return false;
};

type UpdatablePlatformField = (typeof UPDATABLE_PLATFORM_FIELDS)[number];

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
    private fileService: FileService,
    private httpService: HttpService,
    private readonly pino: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {}

  async getToken() {
    const { data: authData } = await igdbAuth();
    return authData;
  }

  async backfillGamesFromIgdb(options?: {
    limit?: number;
    delayMs?: number;
    concurrency?: number;
    parseImages?: boolean;
    field?: string;
    forceParse?: boolean;
    releaseAfter?: number;
    skipCheckpoint?: boolean;
  }) {
    try {
      const token = await this.getIgdbToken();

      let processedCount = 0;
      let checkpoint = 0;

      if (!options?.skipCheckpoint) {
        await this.markGamesBackfillStarted();
      }

      let alreadyFilledCount = 0;
      if (options?.field && !options?.forceParse) {
        const filledFilter: mongoose.FilterQuery<GameDocument> = {
          [options.field]: { $nin: [null, "", []] },
        };
        if (typeof options?.releaseAfter === "number") {
          filledFilter.first_release = { $gt: options.releaseAfter };
        }
        alreadyFilledCount = await this.Games.countDocuments(filledFilter);
      }

      await igdbParser<IGDBExpandedGame>({
        token,
        action: "games",
        options: {
          limit: options?.limit || DEFAULT_IGDB_SYNC_LIMIT,
          delayMs: options?.delayMs ?? DEFAULT_IGDB_SYNC_DELAY_MS,
          sort: "updated_at asc",
          fields: SINGLE_GAME_QUERY_FIELDS,
          where:
            typeof options?.releaseAfter === "number"
              ? `first_release_date > ${options.releaseAfter}`
              : undefined,
          isCollectItems: false,
        },
        parsingCallback: async (items, page) => {
          const existingGames = await this.Games.find({
            "igdb.gameId": { $in: items.map((item) => item.id) },
          })
            .select(
              "_id slug type createdAt igdb cover screenshots artworks isStopParsingPictures isStopParsing" +
                (options?.field ? ` ${options.field}` : "")
            )
            .lean();

          const existingGamesByIgdbId = new Map(
            existingGames.map((game) => [game.igdb.gameId, game])
          );

          const itemsToProcess =
            options?.field && !options?.forceParse
              ? items.filter((igdbGame) => {
                  const existingGame = existingGamesByIgdbId.get(igdbGame.id);
                  return (
                    !existingGame ||
                    isFieldValueEmpty(
                      (existingGame as unknown as Record<string, unknown>)[
                        options.field
                      ]
                    )
                  );
                })
              : items;

          await runWithConcurrency(
            itemsToProcess,
            options?.concurrency || DEFAULT_GAMES_SYNC_CONCURRENCY,
            async (igdbGame) => {
              try {
                await this.upsertGameFromIgdb(
                  igdbGame,
                  existingGamesByIgdbId.get(igdbGame.id),
                  {
                    parseImages: options?.parseImages ?? false,
                    field: options?.field,
                    forceParse: options?.forceParse,
                  }
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

          const remainingTotal = Math.max(page.total - alreadyFilledCount, 0);
          this.logger.log(
            `IGDB games backfill progress: page ${page.page}, processed ${processedCount}/${remainingTotal}`
          );

          if (!options?.skipCheckpoint) {
            checkpoint = getMaxUpdatedAt(items, checkpoint);
            await this.setGamesBackfillProgress(checkpoint);
          }
        },
      });

      if (!options?.skipCheckpoint) {
        await this.markGamesBackfillCompleted(checkpoint);
      }

      this.logger.log(
        `IGDB games backfill finished, processed ${processedCount} games`
      );

      return {
        processedCount,
        lastUpdatedAt: checkpoint,
      };
    } catch (err) {
      this.logger.error(err, `Failed to backfill games from IGDB`);
      throw err;
    }
  }

  async syncGamesFromIgdb(options?: {
    limit?: number;
    delayMs?: number;
    concurrency?: number;
    parseImages?: boolean;
    field?: string;
    forceParse?: boolean;
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
          })
            .select(
              "_id slug type createdAt igdb cover screenshots artworks isStopParsingPictures isStopParsing"
            )
            .lean();

          const existingGamesByIgdbId = new Map(
            existingGames.map((game) => [game.igdb.gameId, game])
          );

          await runWithConcurrency(
            items,
            options?.concurrency || DEFAULT_GAMES_SYNC_CONCURRENCY,
            async (igdbGame) => {
              try {
                const existingGame = existingGamesByIgdbId.get(igdbGame.id);
                await this.upsertGameFromIgdb(igdbGame, existingGame, {
                  parseImages: options?.parseImages ?? true,
                  field: options?.field,
                  forceParse: options?.forceParse,
                });
                this.metrics.recordGames(
                  "igdb",
                  existingGame ? "updated" : "added",
                  1
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
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, "igdb-games-sync", () =>
        this.metrics.trackSync("igdb-games-sync", () =>
          this.runSyncUpdatedGamesCron()
        )
      )
    );
  }

  @Cron(IGDB_GAMES_LINK_RELATED_CRON, IGDB_GAMES_LINK_RELATED_CRON_OPTIONS)
  async linkRelatedGamesCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, "igdb-games-link-related", () =>
        this.metrics.trackSync("igdb-games-link-related", () =>
          this.linkRelatedGames()
        )
      )
    );
  }

  async parsePlatformsFromIgdb(options?: { field?: string }) {
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
              await this.upsertPlatformFromIgdb(platform, options?.field);
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

  async parseGameFromIgdb(
    identifier: { igdbId?: number; slug?: string },
    options?: { parseImages?: boolean; field?: string; forceParse?: boolean }
  ) {
    try {
      if (!identifier.igdbId && !identifier.slug) {
        throw new BadRequestException("Either igdbId or slug must be provided");
      }

      const token = await this.getIgdbToken();

      return await this.parseSingleGameFromIgdb(identifier, token, options);
    } catch (err) {
      this.logger.error(
        err,
        `Failed to parse game from IGDB: ${identifier.igdbId ?? identifier.slug}`
      );
      throw err;
    }
  }

  async linkRelatedGames() {
    try {
      const games = await this.Games.find({
        "igdb.gameId": { $exists: true },
      })
        .select(
          "_id igdb.gameId igdb.parent_game " +
            RELATED_GAME_ARRAY_FIELDS.map((field) => `igdb.${field}`).join(" ")
        )
        .lean();

      const idByIgdbId = new Map(
        games.map((game) => [game.igdb.gameId, game._id])
      );

      const now = new Date().toISOString();
      const bulkOps = [];

      for (const game of games) {
        const relatedGames: Record<string, unknown> = {};
        let hasAny = false;

        for (const field of RELATED_GAME_ARRAY_FIELDS) {
          const igdbIds = game.igdb[field] as number[] | undefined;
          if (!igdbIds?.length) continue;

          const resolved = igdbIds
            .map((igdbId) => idByIgdbId.get(igdbId))
            .filter((id): id is mongoose.Types.ObjectId => !!id);

          if (resolved.length) {
            relatedGames[field] = resolved;
            hasAny = true;
          }
        }

        if (game.igdb.parent_game) {
          const parentId = idByIgdbId.get(game.igdb.parent_game);
          if (parentId) {
            relatedGames.parent_game = parentId;
            hasAny = true;
          }
        }

        if (hasAny) {
          bulkOps.push({
            updateOne: {
              filter: { _id: game._id },
              update: { $set: { relatedGames, updatedAt: now } },
            },
          });
        }
      }

      this.logger.log(
        `Linking related games: ${bulkOps.length}/${games.length} games to update`
      );

      let updatedCount = 0;
      for (let i = 0; i < bulkOps.length; i += RELATED_GAMES_LINK_BATCH_SIZE) {
        const batch = bulkOps.slice(i, i + RELATED_GAMES_LINK_BATCH_SIZE);
        await this.Games.bulkWrite(batch);
        updatedCount += batch.length;

        this.logger.log(
          `Linked related games progress: ${updatedCount}/${bulkOps.length}`
        );
      }

      this.logger.log(
        `Linked related games for ${updatedCount}/${games.length} games`
      );

      return { matched: games.length, updated: updatedCount };
    } catch (err) {
      this.logger.error(err, "Failed to link related games");
      throw err;
    }
  }

  async deduplicateGameSlugs() {
    try {
      const duplicateGroups = await this.Games.aggregate<{
        _id: string;
        docs: {
          _id: mongoose.Types.ObjectId;
          createdAt: string;
        }[];
      }>([
        {
          $group: {
            _id: "$slug",
            docs: {
              $push: {
                _id: "$_id",
                createdAt: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]);

      const now = new Date().toISOString();
      const bulkOps = [];

      for (const group of duplicateGroups) {
        const [, ...rest] = [...group.docs].sort((a, b) =>
          a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
        );

        rest.forEach((doc, index) => {
          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: { slug: `${group._id}-${index + 2}`, updatedAt: now },
              },
            },
          });
        });
      }

      if (bulkOps.length) {
        await this.Games.bulkWrite(bulkOps);
      }

      this.logger.log(
        `Deduplicated ${bulkOps.length} game slug(s) across ${duplicateGroups.length} collision group(s)`
      );

      return { collisions: duplicateGroups.length, renamed: bulkOps.length };
    } catch (err) {
      this.logger.error(err, "Failed to deduplicate game slugs");
      throw err;
    }
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
      } catch (e: any) {
        this.logger.error(
          "Image error: " +
            (e?.response?.status || e?.err?.message || "unknown")
        );
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

  private async upsertPlatformFromIgdb(
    platform: IGDBExpandedPlatform,
    field?: string
  ) {
    if (
      field &&
      !UPDATABLE_PLATFORM_FIELDS.includes(field as UpdatablePlatformField)
    ) {
      throw new BadRequestException(
        `Unknown field: ${field}. Allowed: ${UPDATABLE_PLATFORM_FIELDS.join(", ")}`
      );
    }

    if (field) {
      const exists = await this.Platforms.exists({ igdbId: platform.id });
      if (!exists) {
        throw new NotFoundException(
          `Cannot update field "${field}": platform not found in platforms yet`
        );
      }
    }

    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
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
      updateAt: now,
    };

    const setPayload = field
      ? { [field]: update[field], updateAt: now }
      : update;

    await this.Platforms.updateOne(
      { igdbId: platform.id },
      {
        $set: setPayload,
        $setOnInsert: { createdAt: now },
      },
      { upsert: !field }
    );
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
    identifier: { igdbId?: number; slug?: string },
    token: string,
    options?: { parseImages?: boolean; field?: string; forceParse?: boolean }
  ) {
    const { data } = await igdbAgent<IGDBExpandedGame[]>(
      getLink("games"),
      token,
      buildIgdbQueryParams(SINGLE_GAME_QUERY_FIELDS, {
        where: identifier.igdbId
          ? `id = ${identifier.igdbId}`
          : `slug = "${identifier.slug}"`,
        limit: 1,
      })
    );

    const igdbGame = data?.[0];

    if (!igdbGame) {
      throw new NotFoundException(
        `IGDB game not found: ${identifier.igdbId ?? identifier.slug}`
      );
    }

    const existingGame = await this.Games.findOne({
      "igdb.gameId": igdbGame.id,
    })
      .select(
        "_id slug type createdAt cover screenshots artworks isStopParsingPictures isStopParsing"
      )
      .lean();

    return this.upsertGameFromIgdb(igdbGame, existingGame, {
      parseImages: options?.parseImages ?? true,
      field: options?.field,
      forceParse: options?.forceParse,
    });
  }

  private async parseGameImagesFromIgdb(
    igdbGame: IGDBExpandedGame,
    slug: string,
    existingGame?: Pick<
      GameDocument,
      "cover" | "screenshots" | "artworks" | "isStopParsingPictures"
    >,
    options?: { type?: ImageField; forceParse?: boolean }
  ) {
    if (existingGame?.isStopParsingPictures) {
      return;
    }

    const update: Partial<
      Pick<GameDocument, "cover" | "screenshots" | "artworks">
    > = {};

    const wants = (type: ImageField) => !options?.type || options.type === type;

    if (
      wants("cover") &&
      igdbGame.cover?.url &&
      (options?.forceParse || !existingGame?.cover)
    ) {
      try {
        await this.clearExistingImages("mooncellar-covers", slug);
        const [link] = await this.sendArrayToS3("mooncellar-covers", slug, [
          getImageLink(igdbGame.cover.url, "cover_big", 2),
        ]);

        if (link) {
          update.cover = link;
        }
      } catch (e) {
        this.logger.error(e, `Failed to parse cover for game: ${slug}`);
      }
    }

    if (wants("screenshots")) {
      const screenshotsCount = igdbGame.screenshots?.length || 0;
      if (
        options?.forceParse ||
        (existingGame?.screenshots?.length || 0) !== screenshotsCount
      ) {
        try {
          await this.clearExistingImages("mooncellar-screenshots", slug);
          update.screenshots = await this.sendArrayToS3(
            "mooncellar-screenshots",
            slug,
            igdbGame.screenshots || []
          );
        } catch (e) {
          this.logger.error(e, `Failed to parse screenshots for game: ${slug}`);
        }
      }
    }

    if (wants("artworks")) {
      const artworksCount = igdbGame.artworks?.length || 0;
      if (
        options?.forceParse ||
        (existingGame?.artworks?.length || 0) !== artworksCount
      ) {
        try {
          await this.clearExistingImages("mooncellar-artworks", slug);
          update.artworks = await this.sendArrayToS3(
            "mooncellar-artworks",
            slug,
            igdbGame.artworks || []
          );
        } catch (e) {
          this.logger.error(e, `Failed to parse artworks for game: ${slug}`);
        }
      }
    }

    if (Object.keys(update).length) {
      try {
        await this.Games.updateOne(
          { "igdb.gameId": igdbGame.id },
          { $set: update }
        );
      } catch (e) {
        this.logger.error(e, `Failed to save parsed images for game: ${slug}`);
      }
    }
  }

  private async upsertGameFromIgdb(
    igdbGame: IGDBExpandedGame,
    existingGame?: Pick<
      GameDocument,
      | "_id"
      | "slug"
      | "type"
      | "createdAt"
      | "cover"
      | "screenshots"
      | "artworks"
      | "isStopParsingPictures"
      | "isStopParsing"
    >,
    options?: { parseImages?: boolean; field?: string; forceParse?: boolean }
  ) {
    if (existingGame?.isStopParsing) {
      this.logger.log(`Skipped game with isStopParsing: ${existingGame.slug}`);
      return existingGame.slug + " skipped";
    }

    if (
      options?.field &&
      !ALL_UPDATABLE_GAME_FIELDS.includes(
        options.field as (typeof ALL_UPDATABLE_GAME_FIELDS)[number]
      )
    ) {
      throw new BadRequestException(
        `Unknown field: ${options.field}. Allowed: ${ALL_UPDATABLE_GAME_FIELDS.join(", ")}`
      );
    }

    if (options?.field && !existingGame) {
      throw new NotFoundException(
        `Cannot update field "${options.field}": game not found in games yet`
      );
    }

    if (options?.field && IMAGE_FIELDS.includes(options.field as ImageField)) {
      await this.parseGameImagesFromIgdb(
        igdbGame,
        igdbGame.slug,
        existingGame,
        {
          type: options.field as ImageField,
          forceParse: options.forceParse,
        }
      );

      this.logger.log(
        `Parsed field "${options.field}" for game from IGDB: ${igdbGame.slug}`
      );

      return igdbGame.slug + " parsed";
    }

    if (options?.field === HYPES_FIELD) {
      await this.Games.updateOne(
        { "igdb.gameId": igdbGame.id },
        {
          $set: {
            "igdb.hypes": igdbGame.hypes,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      this.logger.log(
        `Parsed field "${options.field}" for game from IGDB: ${igdbGame.slug}`
      );

      return igdbGame.slug + " parsed";
    }

    const platformIds = await this.Platforms.find({
      igdbId: { $in: igdbGame.platforms || [] },
    }).select("_id igdbId");

    const now = new Date().toISOString();

    const externalPagesFromIgdb = (igdbGame.external_games || []).map(
      (externalGame) => ({
        name:
          externalGameSourceNames[externalGame.external_game_source] ??
          parseStoreNameFromUrl(externalGame.url),
        uid: externalGame.uid,
        url: externalGame.url ?? null,
      })
    );

    const hasSteamStore = externalPagesFromIgdb.some(
      (store) => store.name === "Steam"
    );

    const steamFromWebsites = hasSteamStore
      ? null
      : findSteamAppInfo((igdbGame.websites || []).map((site) => site.url));

    const externalPages = steamFromWebsites
      ? mergeSteamStore(externalPagesFromIgdb, steamFromWebsites)
      : externalPagesFromIgdb;

    const resolvedSlug =
      !options?.field || options.field === "slug"
        ? await this.resolveUniqueSlug(igdbGame.slug, existingGame?._id)
        : igdbGame.slug;

    const update = {
      slug: resolvedSlug,
      name: igdbGame.name,
      nameNormalized: normalizeGameName(igdbGame.name),
      type:
        igdbGame.game_type?.type ||
        (igdbGame.category !== undefined
          ? categoryTypeNames[igdbGame.category]
          : undefined) ||
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
      franchises: mergeFranchises(
        igdbGame.franchises,
        igdbGame.franchise,
        igdbGame.collections
      ).map((franchise) => franchise.name),
      videos: (igdbGame.videos || []).map(
        (video) => `https://www.youtube.com/watch?v=${video.video_id}`
      ),
      alternative_names: (igdbGame.alternative_names || []).map(
        (alt) => alt.name
      ),
      first_release: igdbGame.first_release_date,
      release_dates: (igdbGame.release_dates || []).map((date) => ({
        date: date.date,
        human: date.human,
        month: date.m,
        year: date.y,
        platformId: platformIds.find((plat) => plat.igdbId === date.platform)
          ?._id,
        region: date.release_region,
      })),
      platformIds: platformIds.map((plat) => plat._id),
      status: gameStatusNames[igdbGame.status ?? 0] || null,
      versionTitle: igdbGame.version_title || null,
      game_engines: (igdbGame.game_engines || []).map((engine) => engine.name),
      player_perspectives: (igdbGame.player_perspectives || []).map(
        (perspective) => perspective.name
      ),
      multiplayer_modes: (igdbGame.multiplayer_modes || []).map((mode) => ({
        platformId: platformIds.find((plat) => plat.igdbId === mode.platform)
          ?._id,
        campaignCoop: mode.campaigncoop,
        dropIn: mode.dropin,
        lanCoop: mode.lancoop,
        offlineCoop: mode.offlinecoop,
        offlineCoopMax: mode.offlinecoopmax,
        offlineMax: mode.offlinemax,
        onlineCoop: mode.onlinecoop,
        onlineCoopMax: mode.onlinecoopmax,
        onlineMax: mode.onlinemax,
        splitscreen: mode.splitscreen,
        splitscreenOnline: mode.splitscreenonline,
      })),
      ageRatings: (igdbGame.age_ratings || [])
        .filter((rating) => rating.organization?.name && rating.rating_category?.rating)
        .map((rating) => ({
          organization: rating.organization.name,
          rating: rating.rating_category.rating,
          synopsis: rating.synopsis,
        })),
      languages: Array.from(
        new Set(
          (igdbGame.language_supports || [])
            .map((support) => support.language?.name)
            .filter((name): name is string => !!name)
        )
      ),
      externalPages,
      igdb: {
        gameId: igdbGame.id,
        total_rating: igdbGame.total_rating,
        total_rating_count: igdbGame.total_rating_count,
        aggregated_rating: igdbGame.aggregated_rating,
        aggregated_rating_count: igdbGame.aggregated_rating_count,
        rating: igdbGame.rating,
        rating_count: igdbGame.rating_count,
        hypes: igdbGame.hypes,
        screenshotsCount: igdbGame.screenshots?.length || 0,
        artworksCount: igdbGame.artworks?.length || 0,
        status: igdbGame.status ?? 0,
        version_parent: igdbGame.version_parent ?? null,
        parent_game: igdbGame.parent_game ?? null,
        url: igdbGame.url,
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
        franchises: mergeFranchises(
          igdbGame.franchises,
          igdbGame.franchise,
          igdbGame.collections
        ).map((f) => f.id),
        videos: (igdbGame.videos || []).map((v) => v.id),
        alternative_names: (igdbGame.alternative_names || []).map((a) => a.id),
        game_engines: (igdbGame.game_engines || []).map((engine) => engine.id),
        player_perspectives: (igdbGame.player_perspectives || []).map(
          (perspective) => perspective.id
        ),
        dlcs: igdbGame.dlcs || [],
        expansions: igdbGame.expansions || [],
        standalone_expansions: igdbGame.standalone_expansions || [],
        bundles: igdbGame.bundles || [],
        expanded_games: igdbGame.expanded_games || [],
        forks: igdbGame.forks || [],
        ports: igdbGame.ports || [],
        remakes: igdbGame.remakes || [],
        remasters: igdbGame.remasters || [],
        similar_games: igdbGame.similar_games || [],
      },
      createdAt: existingGame?.createdAt || now,
      updatedAt: now,
    };

    const setPayload = options?.field
      ? {
          [options.field]: update[options.field as keyof typeof update],
          updatedAt: update.updatedAt,
        }
      : update;

    await this.Games.updateOne(
      { "igdb.gameId": igdbGame.id },
      { $set: setPayload },
      { upsert: !options?.field }
    );

    if (options?.parseImages) {
      await this.parseGameImagesFromIgdb(igdbGame, update.slug, existingGame, {
        forceParse: options.forceParse,
      });
    }

    this.logger.log(
      options?.field
        ? `Parsed field "${options.field}" for game from IGDB: ${update.slug}`
        : `Parsed game from IGDB: ${update.slug}`
    );

    return update.slug + " parsed";
  }

  private async resolveUniqueSlug(
    candidateSlug: string,
    excludeId?: mongoose.Types.ObjectId
  ): Promise<string> {
    let slug = candidateSlug;
    let suffix = 2;

    while (
      await this.Games.exists({
        slug,
        ...(excludeId && { _id: { $ne: excludeId } }),
      })
    ) {
      slug = `${candidateSlug}-${suffix}`;
      suffix++;
    }

    if (slug !== candidateSlug) {
      this.logger.warn(
        `Slug collision for "${candidateSlug}", using "${slug}" instead`
      );
    }

    return slug;
  }

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
}

interface IGDBExpandedPlatform {
  id: number;
  name: string;
  slug: string;
  generation?: number;
  created_at?: number;
  platform_family?: { name: string; slug: string };
  platform_logo?: { url: string };
}

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
  hypes?: number;
  updated_at?: number;
  cover?: { id: number; url: string };
  screenshots?: { id: number; url: string }[];
  artworks?: { id: number; url: string }[];
  franchises?: { id: number; name: string }[];
  franchise?: { id: number; name: string };
  collections?: { id: number; name: string }[];
  videos?: { id: number; video_id: string }[];
  alternative_names?: { id: number; name: string }[];
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
    release_region: number;
  }[];
  status?: number;
  version_parent?: number;
  version_title?: string;
  parent_game?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  rating?: number;
  rating_count?: number;
  url?: string;
  game_engines?: { id: number; name: string }[];
  player_perspectives?: { id: number; name: string }[];
  multiplayer_modes?: {
    platform?: number;
    campaigncoop?: boolean;
    dropin?: boolean;
    lancoop?: boolean;
    offlinecoop?: boolean;
    offlinecoopmax?: number;
    offlinemax?: number;
    onlinecoop?: boolean;
    onlinecoopmax?: number;
    onlinemax?: number;
    splitscreen?: boolean;
    splitscreenonline?: boolean;
  }[];
  age_ratings?: {
    organization?: { name: string };
    rating_category?: { rating: string };
    synopsis?: string;
  }[];
  language_supports?: { language?: { name: string } }[];
  external_games?: {
    uid: string;
    url?: string;
    external_game_source: number;
  }[];
  dlcs?: number[];
  expansions?: number[];
  standalone_expansions?: number[];
  bundles?: number[];
  expanded_games?: number[];
  forks?: number[];
  ports?: number[];
  remakes?: number[];
  remasters?: number[];
  similar_games?: number[];
}
