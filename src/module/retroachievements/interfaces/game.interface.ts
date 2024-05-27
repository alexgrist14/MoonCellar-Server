import { Document } from 'mongoose';

export interface IGame extends Document {
  readonly title: string;
  readonly id: number;
  readonly consoleId: number;
  readonly consoleName: string;
  readonly imageIcon: string;
  readonly numAchievements: number;
  readonly numLeaderboards: number;
  readonly points: number;
  readonly dateModified: string;
  readonly forumTopicId: number;
  readonly hashes: string[];
}
