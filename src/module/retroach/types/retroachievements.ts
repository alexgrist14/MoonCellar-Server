export interface IRAGame {
  title: string;
  id: number;
  consoleId: number;
  consoleName: string;
  imageIcon: string;
  numAchievements: number;
  numLeaderboards: number;
  points: number;
  dateModified: string;
  forumTopicId: number;
  hashes: string[];
}

export interface IDataBase {
  game: IRAGame[];
}

export const RA_MAIN_USER_NAME = 'alexgrist14';
