export type ILogType = "list" | "custom" | "rating";

export interface ILog {
  _id: string;
  date: string;
  type: string;
  text: string;
  gameId: number;
  userId: string;
  game: Game[];
}

export interface Game {
  cover: Cover;
  name: string;
  slug: string;
}

export interface Cover {
  url: string;
}
