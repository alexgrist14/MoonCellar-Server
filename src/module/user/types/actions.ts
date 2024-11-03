export type categoriesType = 'completed' | 'wishlist' | 'dropped' | 'playing';

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number | undefined;
  gameId: number;
}

export const categories: categoriesType[] = [
  'completed',
  'wishlist',
  'dropped',
  'playing',
];
