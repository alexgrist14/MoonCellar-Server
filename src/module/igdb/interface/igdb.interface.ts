export interface IGDBCover {
  id: number;
  game: number;
  url: string;
}

export interface IGDBMode {
  id: number;
  name: string;
  slug: string;
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
  platform_family: number;
  platform_logo: number;
  generation: number;
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
  cover: string;
  screenshots: number[];
  total_rating: number;
  artworks: number[];
  franchise: number;
  franchises: number[];
}
