import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBGamesDocument = HydratedDocument<IGDBGames>;

@Schema()
export class IGDBGames {
  @Prop()
  id: number;
  @Prop()
  game_modes: number[];
  @Prop()
  genres: number[];
  @Prop()
  name: string;
  @Prop()
  platforms: number[];
  @Prop()
  slug: string;
  @Prop()
  keywords: number[];
  @Prop()
  themes: number[];
  @Prop()
  cover: number[];
  @Prop()
  screenshots: number[];
  @Prop()
  total_rating: number;
  @Prop()
  aggregated_rating: number;
  @Prop()
  category: number;
  @Prop()
  artworks: number[];
  @Prop()
  storyline: string;
  @Prop()
  summary: string;
  @Prop()
  first_release_date: number;
}

export const IGDBGamesSchema = SchemaFactory.createForClass(IGDBGames);
