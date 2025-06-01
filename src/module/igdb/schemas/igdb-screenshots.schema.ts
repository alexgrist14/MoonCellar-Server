import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IGDBScreenshotsDocument = HydratedDocument<IGDBScreenshots>;

@Schema()
export class IGDBScreenshots {
  @Prop()
  _id: number;
  @Prop()
  url: string;
  @Prop()
  width: number;
  @Prop()
  height: number;
}

export const IGDBScreenshotsSchema =
  SchemaFactory.createForClass(IGDBScreenshots);
