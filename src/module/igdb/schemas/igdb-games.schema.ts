import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type IGDBGamesDocument = HydratedDocument<IGDBGames>;

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
  @Prop({ ref: 'IGDBKeywords' })
  keywords: mongoose.Schema.Types.ObjectId[];
  @Prop({ ref: 'IGDBThemes' })
  themes: mongoose.Schema.Types.ObjectId[];
  @Prop()
  url: string;
  @Prop({ ref: 'IGDBCovers' })
  cover: mongoose.Schema.Types.ObjectId;
  @Prop({ ref: 'IGDBScreenshots' })
  screenshots: mongoose.Schema.Types.ObjectId[];
  @Prop()
  total_rating: number;
  @Prop({ ref: 'IGDBArtworks' })
  artworks: mongoose.Schema.Types.ObjectId[];
}

export const IGDBGamesSchema = SchemaFactory.createForClass(IGDBGames);
