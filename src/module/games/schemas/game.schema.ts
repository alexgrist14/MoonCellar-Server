import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import {
  ICompanyField,
  IGDBField,
  IHltbField,
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
  franchises: string[];
  @Prop()
  videos: string[];
  @Prop({ type: [Object] })
  companies: ICompanyField[];
  @Prop()
  websites: string[];
  @Prop()
  first_release: number;
  @Prop({ type: [Object] })
  release_dates: IReleaseDate[];
  @Prop({ ref: Platform.name })
  platformIds: mongoose.Types.ObjectId[];
  @Prop({ type: [Object] })
  retroachievements: IRetroachievementsField[];
  @Prop()
  rating: number;
  @Prop()
  ratingCount: number;
  @Prop()
  averageRating: number;
  @Prop({ default: false })
  isStopParsingPictures: boolean;
  @Prop({ default: false })
  isCustom: boolean;
  @Prop({ type: Object })
  igdb: IGDBField;
  @Prop({ type: Object })
  hltb: IHltbField;
  @Prop()
  hltbNotFoundAt: string;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const GameDatabaseSchema = SchemaFactory.createForClass(Game);
GameDatabaseSchema.index({ "igdb.gameId": 1 });
GameDatabaseSchema.index({ "hltb.updatedAt": 1, _id: 1 });
GameDatabaseSchema.index({ hltbNotFoundAt: 1 });
