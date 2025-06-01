import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { IGDBPlatforms } from "src/module/igdb/schemas/igdb-platforms.schema";
import { IGDBReleaseDates } from "src/module/igdb/schemas/igdb-release-dates.schema";
import { User } from "src/module/user/schemas/user.schema";
import { IGDBGames } from "src/shared/schemas/igdb-games.schema";

export type IGamesPlaythroughsDocument = HydratedDocument<GamesPlaythroughs>;

@Schema()
export class GamesPlaythroughs {
  @Prop({ ref: User.name })
  userId: mongoose.Schema.Types.ObjectId;
  @Prop()
  dateStart: string;
  @Prop()
  dateEnd: string;
  @Prop()
  timeMinutes: number;
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
}

export const IGamesPlaythroughsSchema =
  SchemaFactory.createForClass(GamesPlaythroughs);
