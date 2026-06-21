import {
  buildIncrementalHltbFilter,
  buildMissingHltbFilter,
  hasHltbTimes,
  mapHltbEntryToField,
  pickBestHltbMatch,
} from "./hltb.utils";
import { HLTB_STALE_DAYS } from "../constants/hltb";

describe("hltb.utils", () => {
  describe("pickBestHltbMatch", () => {
    it("returns the highest similarity match above threshold", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 50419,
            name: "Nioh: Complete Edition",
            similarity: 0.2,
            mainTime: 42 * 3600,
            mainExtraTime: 84 * 3600,
            completionistTime: 97 * 3600,
          },
          {
            id: 36936,
            name: "Nioh",
            similarity: 1,
            mainTime: 34.5 * 3600,
            mainExtraTime: 61 * 3600,
            completionistTime: 93.5 * 3600,
          },
        ],
        "Nioh"
      );

      expect(result?.id).toBe(36936);
    });

    it("returns null when similarity is below threshold", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 1,
            name: "Unrelated Game",
            similarity: 0.1,
            mainTime: 10 * 3600,
          },
        ],
        "Elden Ring"
      );

      expect(result).toBeNull();
    });
  });

  describe("mapHltbEntryToField", () => {
    it("maps HLTB entry fields to stored schema", () => {
      const mapped = mapHltbEntryToField({
        id: 36936,
        name: "Nioh",
        mainTime: 34.5 * 3600,
        mainExtraTime: 61 * 3600,
        completionistTime: 93.5 * 3600,
      });

      expect(mapped).toEqual({
        hltbId: "36936",
        mainStory: 34.5,
        mainExtra: 61,
        completionist: 93.5,
        sourceName: "Nioh",
        updatedAt: expect.any(String),
      });
    });

    it("normalizes non-positive values to null", () => {
      const mapped = mapHltbEntryToField({
        id: 1,
        name: "Test",
        mainTime: 0,
        mainExtraTime: -1,
        completionistTime: 10 * 3600,
      });

      expect(mapped.mainStory).toBeNull();
      expect(mapped.mainExtra).toBeNull();
      expect(mapped.completionist).toBe(10);
    });
  });

  describe("hasHltbTimes", () => {
    it("returns true when at least one time exists", () => {
      expect(
        hasHltbTimes({
          hltbId: "1",
          mainStory: 10,
          updatedAt: "2026-01-01T00:00:00.000Z",
        })
      ).toBe(true);
    });

    it("returns false when all times are missing", () => {
      expect(
        hasHltbTimes({
          hltbId: "1",
          mainStory: null,
          mainExtra: null,
          completionist: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        })
      ).toBe(false);
    });
  });

  describe("buildIncrementalHltbFilter", () => {
    it("includes stale records older than staleDays", () => {
      const now = Date.parse("2026-06-21T00:00:00.000Z");
      const filter = buildIncrementalHltbFilter(HLTB_STALE_DAYS, now);

      expect(filter).toEqual({
        $or: [
          { hltb: { $exists: false } },
          { "hltb.updatedAt": { $exists: false } },
          { "hltb.updatedAt": { $lt: "2026-05-22T00:00:00.000Z" } },
          {
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
          },
        ],
      });
    });
  });

  describe("buildMissingHltbFilter", () => {
    it("matches only games without hltb data", () => {
      expect(buildMissingHltbFilter()).toEqual({
        $or: [
          { hltb: { $exists: false } },
          {
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
          },
        ],
      });
    });
  });
});
