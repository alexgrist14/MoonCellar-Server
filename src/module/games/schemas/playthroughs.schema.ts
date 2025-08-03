import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { IGDBPlatforms } from "src/module/igdb/schemas/igdb-platforms.schema";
import { IGDBReleaseDates } from "src/module/igdb/schemas/igdb-release-dates.schema";
import { User } from "src/module/user/schemas/user.schema";
import { CategoriesType } from "src/module/user/types/actions";
import { IGDBGames } from "src/shared/schemas/igdb-games.schema";
import { Platform } from "./platform.schema";
import { Game } from "./game.schema";

export type IPlaythroughDocument = HydratedDocument<Playthrough>;

@Schema()
export class Playthrough {
  @Prop({ ref: User.name })
  userId: mongoose.Schema.Types.ObjectId;
  @Prop()
  category: CategoriesType;
  @Prop()
  date: string;
  @Prop()
  time: number;
  @Prop()
  comment: string;
  @Prop({ ref: Game.name })
  gameId: mongoose.Schema.Types.ObjectId;
  @Prop({ ref: Platform.name })
  platformId: mongoose.Schema.Types.ObjectId;
  @Prop()
  isMastered: boolean;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const PlaythroughDatabaseSchema =
  SchemaFactory.createForClass(Playthrough);
