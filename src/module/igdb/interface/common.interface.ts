export type ParserType =
  | 'games'
  | 'genres'
  | 'covers'
  | 'modes'
  | 'platforms'
  | 'families';

export interface IGDBFilters {
  genres?: string[] | string;
  platforms?: string[] | string;
  modes?: string[] | string;
}
