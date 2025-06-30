export type ParserType =
  | "games"
  | "genres"
  | "covers"
  | "modes"
  | "platforms"
  | "families"
  | "screenshots"
  | "keywords"
  | "themes"
  | "artworks"
  | "websites"
  | "involved_companies"
  | "companies"
  | "release_dates"
  | "platform_logos"
  | "game_types";

export interface IGDBFilters {
  genres?: string[] | string;
  platforms?: string[] | string;
  modes?: string[] | string;
  keywords?: string[] | string;
  themes?: string[] | string;
  gameTypes?: string[] | string;
}
