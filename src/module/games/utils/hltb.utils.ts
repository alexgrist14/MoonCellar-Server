import { IHltbField } from "src/shared/zod/schemas/games.schema";
import { HLTB_MIN_SIMILARITY } from "../constants/hltb";

export type HltbSearchEntry = {
  id: number;
  name: string;
  mainTime?: number;
  mainExtraTime?: number;
  completionistTime?: number;
  similarity?: number;
};

const secondsToHours = (seconds?: number | null): number | null => {
  if (seconds == null || seconds <= 0) {
    return null;
  }

  return Math.round((seconds / 3600) * 10) / 10;
};

export const pickBestHltbMatch = (
  results: HltbSearchEntry[],
  gameName: string
): HltbSearchEntry | null => {
  if (!results?.length) {
    return null;
  }

  const normalizedGameName = gameName.trim().toLowerCase();

  const sorted = [...results].sort((a, b) => {
    const similarityDiff = (b.similarity ?? 0) - (a.similarity ?? 0);
    if (similarityDiff !== 0) {
      return similarityDiff;
    }

    const aExact = a.name.trim().toLowerCase() === normalizedGameName ? 1 : 0;
    const bExact = b.name.trim().toLowerCase() === normalizedGameName ? 1 : 0;

    return bExact - aExact;
  });

  const best = sorted[0];

  if ((best.similarity ?? 0) < HLTB_MIN_SIMILARITY) {
    return null;
  }

  return best;
};

export const mapHltbEntryToField = (entry: HltbSearchEntry): IHltbField => ({
  hltbId: String(entry.id),
  mainStory: secondsToHours(entry.mainTime),
  mainExtra: secondsToHours(entry.mainExtraTime),
  completionist: secondsToHours(entry.completionistTime),
  sourceName: entry.name,
  updatedAt: new Date().toISOString(),
});

export const hasHltbTimes = (hltb?: IHltbField | null): boolean =>
  !!hltb &&
  (hltb.mainStory != null ||
    hltb.mainExtra != null ||
    hltb.completionist != null);

const missingHltbTimesFilter = {
  $and: [
    {
      $or: [
        { "hltb.mainStory": { $exists: false } },
        { "hltb.mainStory": null },
      ],
    },
    {
      $or: [
        { "hltb.mainExtra": { $exists: false } },
        { "hltb.mainExtra": null },
      ],
    },
    {
      $or: [
        { "hltb.completionist": { $exists: false } },
        { "hltb.completionist": null },
      ],
    },
  ],
};

export const getStaleBeforeIso = (staleDays: number, now = Date.now()) =>
  new Date(now - staleDays * 24 * 60 * 60 * 1000).toISOString();

export const buildMissingHltbFilter = () => ({
  $or: [{ hltb: { $exists: false } }, missingHltbTimesFilter],
});

export const buildIncrementalHltbFilter = (staleDays: number, now = Date.now()) => {
  const staleBefore = getStaleBeforeIso(staleDays, now);

  return {
    $or: [
      { hltb: { $exists: false } },
      { "hltb.updatedAt": { $exists: false } },
      { "hltb.updatedAt": { $lt: staleBefore } },
      missingHltbTimesFilter,
    ],
  };
};
