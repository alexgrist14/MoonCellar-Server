import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IGDBPlatforms } from "./igdb-platforms.schema";

export type IGDBReleaseDatesDocument = HydratedDocument<IGDBReleaseDates>;

@Schema()
export class IGDBReleaseDates {
  @Prop()
  _id: number;
  @Prop()
  category: number;
  @Prop()
  date: number;
  @Prop()
  human: string;
  @Prop()
  m: number;
  @Prop()
  y: number;
  @Prop({ ref: IGDBPlatforms.name })
  platform: number;
  @Prop()
  region: number;
}

export const IGDBReleaseDatesSchema =
  SchemaFactory.createForClass(IGDBReleaseDates);
