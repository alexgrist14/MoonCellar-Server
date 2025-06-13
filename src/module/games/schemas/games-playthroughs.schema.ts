import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { IGDBPlatforms } from "src/module/igdb/schemas/igdb-platforms.schema";
import { IGDBReleaseDates } from "src/module/igdb/schemas/igdb-release-dates.schema";
import { User } from "src/module/user/schemas/user.schema";
import { CategoriesType } from "src/module/user/types/actions";
import { IGDBGames } from "src/shared/schemas/igdb-games.schema";

export type IGamesPlaythroughsDocument = HydratedDocument<GamesPlaythroughs>;

@Schema()
export class GamesPlaythroughs {
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
  @Prop({ ref: IGDBGames.name })
  gameId: number;
  @Prop({ ref: IGDBPlatforms.name })
  platformId: number;
  @Prop({ ref: IGDBReleaseDates.name })
  IGDBReleaseDateId: number;
  @Prop()
  isMastered: boolean;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const IGamesPlaythroughsSchema =
  SchemaFactory.createForClass(GamesPlaythroughs);
