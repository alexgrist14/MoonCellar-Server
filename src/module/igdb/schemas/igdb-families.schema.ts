import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IGDBFamiliesDocument = HydratedDocument<IGDBFamilies>;

@Schema()
export class IGDBFamilies {
  @Prop()
  _id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBFamiliesSchema = SchemaFactory.createForClass(IGDBFamilies);
