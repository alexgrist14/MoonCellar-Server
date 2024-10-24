export type ParserType =
  | 'games'
  | 'genres'
  | 'covers'
  | 'modes'
  | 'platforms'
  | 'families'
  | 'screenshots'
  | 'keywords'
  | 'themes'
  | 'artworks'
  | 'platform_logos';

export interface IGDBFilters {
  genres?: string[] | string;
  platforms?: string[] | string;
  modes?: string[] | string;
  keywords?: string[] | string;
}
