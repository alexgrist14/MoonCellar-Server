export const HLTB_SYNC_CRON = "0 5 * * 0";
export const HLTB_SYNC_CRON_OPTIONS = {
  name: "hltb-weekly-sync",
  timeZone: "Europe/Moscow",
};

export const HLTB_DEFAULT_BATCH_SIZE = 50;
export const HLTB_DEFAULT_DELAY_MS = 1500;

/** Cron limits for low-resource hosts (e.g. Raspberry Pi). */
export const HLTB_CRON_MAX_GAMES = 30000;
export const HLTB_CRON_DELAY_MS = 3000;
export const HLTB_STALE_DAYS = 30;

export const HLTB_MIN_SIMILARITY = 0.4;
