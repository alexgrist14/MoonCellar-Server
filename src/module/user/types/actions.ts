export type categoriesType =
  | "completed"
  | "wishlist"
  | "dropped"
  | "playing"
  | "backlog"
  | "mastered"
  | "played";

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
}

export interface IUserLogs {
  logs: ILogs[];
}

export const categories: categoriesType[] = [
  "completed",
  "wishlist",
  "dropped",
  "playing",
  "backlog",
  "mastered",
  "played",
];
