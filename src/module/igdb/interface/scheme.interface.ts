import mongoose, { Document } from 'mongoose';
import {
  IGDBCover,
  IGDBFamily,
  IGDBGame,
  IGDBGenre,
  IGDBMode,
  IGDBPlatform,
} from './igdb.interface';

export type IGDBCoverINT = Document & Readonly<IGDBCover>;
export type IGDBGenreINT = Document & Readonly<IGDBGenre>;
export type IGDBFamilyINT = Document & Readonly<IGDBFamily>;
export type IGDBPlatformINT = Document &
  Readonly<Omit<IGDBPlatform, 'platform_family'>> & {
    platform_family: mongoose.Schema.Types.ObjectId | null;
  };
export type IGDBModeINT = Document & Readonly<IGDBMode>;
export type IGDBGameINT = Document &
  Readonly<Omit<IGDBGame, 'cover'>> & { cover?: string };
