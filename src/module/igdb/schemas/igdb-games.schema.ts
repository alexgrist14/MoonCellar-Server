import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IGDBGameINT } from '../interface/scheme.interface';

export type IGDBGamesDocument = HydratedDocument<IGDBGameINT>;

@Schema()
export class IGDBGames {
  @Prop()
  id: number;
  @Prop({ ref: 'IGDBModes' })
  game_modes: mongoose.Schema.Types.ObjectId[];
  @Prop({ ref: 'IGDBGenres' })
  genres: mongoose.Schema.Types.ObjectId[];
  @Prop()
  name: string;
  @Prop({ ref: 'IGDBPlatforms' })
  platforms: mongoose.Schema.Types.ObjectId[];
  @Prop()
  slug: string;
  @Prop()
  tags: number[];
  @Prop()
  themes: number[];
  @Prop()
  url: string;
  @Prop({ ref: 'IGDBCovers' })
  cover: mongoose.Schema.Types.ObjectId;
  @Prop()
  screenshots: number[];
  @Prop()
  total_rating: number;
  @Prop()
  artworks: number[];
  @Prop()
  franchise: number;
  @Prop()
  franchises: number[];
}

export const IGDBGamesSchema = SchemaFactory.createForClass(IGDBGames);
