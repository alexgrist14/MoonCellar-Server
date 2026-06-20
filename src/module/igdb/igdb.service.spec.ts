import {
  IGDB_GAMES_SYNC_CRON,
  IGDB_GAMES_SYNC_CRON_OPTIONS,
  IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY,
  IGDB_GAMES_SYNC_UPDATED_DELAY_MS,
  IGDB_GAMES_SYNC_UPDATED_LIMIT,
} from "./constants/sync";

describe("IGDBService cron configuration", () => {
  it("uses a daily low-load schedule for incremental game sync", () => {
    expect(IGDB_GAMES_SYNC_CRON).toBe("0 4 * * *");
    expect(IGDB_GAMES_SYNC_CRON_OPTIONS).toEqual({
      name: "igdb-games-sync-updated",
      timeZone: "Europe/Moscow",
    });
    expect(IGDB_GAMES_SYNC_UPDATED_LIMIT).toBe(50);
    expect(IGDB_GAMES_SYNC_UPDATED_DELAY_MS).toBe(2000);
    expect(IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY).toBe(2);
  });
});
