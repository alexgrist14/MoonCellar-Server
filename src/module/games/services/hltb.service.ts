import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { HowLongToBeatService } from "howlongtobeat-ts";
import { FilterQuery, Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { sleep } from "src/shared/utils";
import { Game, GameDocument } from "../schemas/game.schema";
import {
  HLTB_CRON_DELAY_MS,
  HLTB_CRON_MAX_GAMES,
  HLTB_DEFAULT_BATCH_SIZE,
  HLTB_DEFAULT_DELAY_MS,
  HLTB_STALE_DAYS,
  HLTB_SYNC_CRON,
  HLTB_SYNC_CRON_OPTIONS,
} from "../constants/hltb";
import {
  buildIncrementalHltbFilter,
  buildMissingHltbFilter,
  hasHltbTimes,
  HltbSearchEntry,
  mapHltbEntryToField,
  pickBestHltbMatch,
} from "../utils/hltb.utils";

export type HltbSyncOptions = {
  limit?: number;
  delayMs?: number;
  onlyMissing?: boolean;
  staleDays?: number;
};

export type HltbSyncResult = {
  status: "running" | "finished" | "skipped" | "empty_queue";
  message: string;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  queuedTotal?: number;
  targetTotal?: number;
  mode?: string;
};

@Injectable()
export class HltbService {
  private readonly hltbClient = new HowLongToBeatService();
  private isSyncRunning = false;

  constructor(
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(HltbService.name);
  }

  @Cron(HLTB_SYNC_CRON, HLTB_SYNC_CRON_OPTIONS)
  async syncHltbCron() {
    try {
      return await this.syncAllGames({
        limit: HLTB_CRON_MAX_GAMES,
        delayMs: HLTB_CRON_DELAY_MS,
        staleDays: HLTB_STALE_DAYS,
      });
    } catch (err) {
      this.logger.error(err, "Failed to run HLTB sync cron");
      throw err;
    }
  }

  async syncAllGames(options?: HltbSyncOptions): Promise<HltbSyncResult> {
    if (this.isSyncRunning) {
      const message = "HLTB sync is already running, skipping new request";
      this.logger.warn(message);

      return {
        status: "skipped",
        message,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
    }

    this.isSyncRunning = true;
    const startedAt = Date.now();

    try {
      return await this.runSync(options, startedAt);
    } finally {
      this.isSyncRunning = false;
    }
  }

  private async runSync(
    options: HltbSyncOptions | undefined,
    startedAt: number
  ): Promise<HltbSyncResult> {
    const maxToProcess = options?.limit;
    const delayMs = options?.delayMs ?? HLTB_DEFAULT_DELAY_MS;
    const pageSize = HLTB_DEFAULT_BATCH_SIZE;
    const filter = this.buildSyncFilter(options);
    const syncMode = this.describeSyncMode(options);

    const queuedTotal = await this.gamesModel.countDocuments(filter);
    const targetTotal =
      maxToProcess != null ? Math.min(maxToProcess, queuedTotal) : queuedTotal;

    this.logger.info(
      `HLTB sync started (${syncMode}): queued=${queuedTotal}, target=${targetTotal}, delayMs=${delayMs}`
    );

    if (queuedTotal === 0) {
      const message =
        syncMode === "missing only"
          ? 'No games without HLTB found. Try without onlyMissing=true or use staleDays=30.'
          : "No games matched the sync filter";

      this.logger.info(`HLTB sync finished: ${message}`);

      return {
        status: "empty_queue",
        message,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        queuedTotal: 0,
        targetTotal: 0,
        mode: syncMode,
      };
    }

    const result = {
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    let skip = 0;
    let batchNumber = 0;

    while (true) {
      if (maxToProcess != null && result.processed >= maxToProcess) {
        break;
      }

      const remaining =
        maxToProcess != null ? maxToProcess - result.processed : pageSize;
      const currentLimit = Math.min(pageSize, remaining);

      batchNumber += 1;
      this.logger.info(
        `HLTB sync batch #${batchNumber}: loading up to ${currentLimit} games (offset=${skip})`
      );

      const games = await this.gamesModel
        .find(filter)
        .select("_id name hltb")
        .sort({ _id: 1 })
        .skip(skip)
        .limit(currentLimit)
        .lean();

      if (!games.length) {
        this.logger.info("HLTB sync: no more games in queue");
        break;
      }

      const bulkOps = [];

      for (const game of games) {
        result.processed += 1;
        const progress = `[${result.processed}/${targetTotal}]`;

        this.logger.info(`${progress} fetching HLTB for "${game.name}"`);

        try {
          const hltb = await this.fetchHltbForGame(
            game.name,
            game.hltb?.hltbId
          );

          if (!hltb || !hasHltbTimes(hltb)) {
            result.skipped += 1;
            this.logger.warn(
              `${progress} skipped "${game.name}" — no HLTB match or empty times`
            );
            continue;
          }

          bulkOps.push({
            updateOne: {
              filter: { _id: game._id },
              update: {
                $set: {
                  hltb,
                  updatedAt: new Date().toISOString(),
                },
              },
            },
          });

          result.updated += 1;
          this.logger.info(
            `${progress} updated "${game.name}" — main=${hltb.mainStory ?? "-"}h, main+extra=${hltb.mainExtra ?? "-"}h, completionist=${hltb.completionist ?? "-"}h`
          );
        } catch (err) {
          result.failed += 1;
          this.logger.warn(
            err,
            `${progress} failed "${game.name}"`
          );
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      if (bulkOps.length) {
        await this.gamesModel.bulkWrite(bulkOps);
        this.logger.info(
          `HLTB sync batch #${batchNumber}: saved ${bulkOps.length} games to database`
        );
      }

      skip += games.length;

      this.logger.info(
        `HLTB sync progress: processed=${result.processed}, updated=${result.updated}, skipped=${result.skipped}, failed=${result.failed}, elapsed=${this.formatElapsed(startedAt)}`
      );

      if (games.length < currentLimit) {
        break;
      }
    }

    const message = `HLTB sync finished in ${this.formatElapsed(startedAt)}: processed=${result.processed}, updated=${result.updated}, skipped=${result.skipped}, failed=${result.failed}`;

    this.logger.info(message);

    return {
      status: "finished",
      message,
      ...result,
      queuedTotal,
      targetTotal,
      mode: syncMode,
    };
  }

  private describeSyncMode(options?: HltbSyncOptions): string {
    if (options?.onlyMissing) {
      return "missing only";
    }

    if (options?.staleDays != null) {
      return `incremental (stale > ${options.staleDays} days)`;
    }

    return "full collection";
  }

  private formatElapsed(startedAt: number): string {
    const seconds = Math.round((Date.now() - startedAt) / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;

    return `${minutes}m ${restSeconds}s`;
  }

  private buildSyncFilter(
    options?: HltbSyncOptions
  ): FilterQuery<GameDocument> {
    if (options?.onlyMissing) {
      return buildMissingHltbFilter();
    }

    if (options?.staleDays != null) {
      return buildIncrementalHltbFilter(options.staleDays);
    }

    return {};
  }

  private async fetchHltbForGame(gameName: string, existingHltbId?: string) {
    if (existingHltbId) {
      try {
        this.logger.debug(
          `Fetching HLTB by id ${existingHltbId} for "${gameName}"`
        );
        const detail = await this.searchById(Number(existingHltbId));

        if (detail) {
          return mapHltbEntryToField(detail);
        }
      } catch (err) {
        this.logger.warn(
          err,
          `Failed to fetch HLTB detail for id ${existingHltbId}, falling back to search`
        );
      }
    }

    this.logger.debug(`Searching HLTB by name for "${gameName}"`);
    const results = await this.search(gameName);
    const bestMatch = pickBestHltbMatch(results, gameName);

    if (!bestMatch) {
      return null;
    }

    return mapHltbEntryToField(bestMatch);
  }

  private async search(gameName: string): Promise<HltbSearchEntry[]> {
    const response = await this.hltbClient.search(gameName);

    if (!response.success || !response.data?.length) {
      return [];
    }

    return response.data.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mainTime: entry.mainTime,
      mainExtraTime: entry.mainExtraTime,
      completionistTime: entry.completionistTime,
      similarity: entry.similarity,
    }));
  }

  private async searchById(hltbId: number): Promise<HltbSearchEntry | null> {
    const response = await this.hltbClient.search(String(hltbId));

    if (!response.success || !response.data?.length) {
      return null;
    }

    return (
      response.data.find((entry) => entry.id === hltbId) ?? response.data[0]
    );
  }
}
