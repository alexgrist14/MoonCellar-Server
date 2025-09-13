import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import {
    ICompanyField,
  IGDBField,
  IReleaseDate,
  IRetroachievementsField,
} from "src/shared/zod/schemas/games.schema";
import { Platform } from "./platform.schema";

export type GameDocument = HydratedDocument<Game>;

@Schema()
export class Game {
  @Prop()
  slug: string;
  @Prop()
  name: string;
  @Prop()
  type: string;
  @Prop()
  cover: string;
  @Prop()
  storyline: string;
  @Prop()
  summary: string;
  @Prop()
  modes: string[];
  @Prop()
  genres: string[];
  @Prop()
  keywords: string[];
  @Prop()
  themes: string[];
  @Prop()
  screenshots: string[];
  @Prop()
  artworks: string[];
  @Prop()
  companies: ICompanyField[];
  @Prop()
  websites: string[];
  @Prop()
  first_release: number;
  @Prop()
  release_dates: IReleaseDate[];
  @Prop({ ref: Platform.name })
  platformIds: mongoose.Types.ObjectId[];
  @Prop()
  retroachievements: IRetroachievementsField[];
  @Prop()
  rating: number;
  @Prop()
  ratingCount: number;
  @Prop({ type: Object })
  igdb: IGDBField;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const GameDatabaseSchema = SchemaFactory.createForClass(Game);
