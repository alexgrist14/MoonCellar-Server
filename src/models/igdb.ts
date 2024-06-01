export interface IGDBCover {
  id: number;
  game: number;
  url: string;
}

export interface IGDBGenre {
  id: number;
  name: string;
  slug: string;
  url: string;
}

export interface IGDBPlatform {
  id: number;
  created_at: number;
  name: string;
  slug: string;
}

export interface IGDBFamily {
  id: number;
  name: string;
  slug: string;
}

export interface IGDBGame {
  id: number;
  game_modes: number[];
  genres: number[];
  name: string;
  platforms: number[];
  slug: string;
  tags: number[];
  themes: number[];
  url: string;
}

export interface IGDBdb {
  game: IGDBGame[];
}

