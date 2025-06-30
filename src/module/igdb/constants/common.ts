import { ParserType } from "../interface/common.interface";

export const parserTypes: ParserType[] = [
  "companies",
  "involved_companies",
  "websites",
  "platform_logos",
  "families",
  "platforms",
  "genres",
  "covers",
  "modes",
  "screenshots",
  "keywords",
  "themes",
  "artworks",
  "release_dates",
  "games",
  "game_types",
];

export const categories = {
  main_game: 0,
  dlc_addon: 1,
  expansion: 2,
  bundle: 3,
  standalone_expansion: 4,
  mod: 5,
  episode: 6,
  season: 7,
  remake: 8,
  remaster: 9,
  expanded_game: 10,
  port: 11,
  fork: 12,
  pack: 13,
  update: 14,
};
