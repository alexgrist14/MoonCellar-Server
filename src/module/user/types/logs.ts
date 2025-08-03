export type ILogType = "list" | "custom" | "rating";

export interface ILog {
  _id: string;
  date: string;
  type: string;
  text: string;
  gameId: string;
  userId: string;
  game: Game[];
}

export type UserLog = Omit<ILog, "_id" | "game" | "date">;

export interface Game {
  cover: Cover;
  name: string;
  slug: string;
}

export interface Cover {
  url: string;
}
