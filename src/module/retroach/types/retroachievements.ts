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

export interface IRAAchievement {
  date: Date;
  hardcoreMode: boolean;
  achievementId: number;
  title: string;
  description: string;
  badgeName: string;
  points: number;
  trueRatio: number;
  type: any;
  author: string;
  gameTitle: string;
  gameIcon: string;
  gameId: number;
  consoleName: string;
  cumulScore: number;
  badgeUrl: string;
  gameUrl: string;
}

type AwardType =
  | 'Achievement Points Yield'
  | 'Achievement Unlocks Yield'
  | 'Certified Legend'
  | 'Game Beaten'
  | 'Invalid or deprecated award type'
  | 'Mastery/Completion'
  | 'Patreon Supporter';

export interface IRAAward {
  awardedAt: string;
  awardType: AwardType;
  awardData: number;
  awardDataExtra: number;
  displayOrder: number;
  title: string;
  consoleName: string;
  flags: number;
  imageIcon: string;
}

export const RA_MAIN_USER_NAME = 'alexgrist14';
