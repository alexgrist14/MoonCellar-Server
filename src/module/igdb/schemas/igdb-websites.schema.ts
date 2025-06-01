import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IGDBWebsitesDocument = HydratedDocument<IGDBWebsites>;

@Schema()
export class IGDBWebsites {
  @Prop()
  _id: number;
  @Prop()
  category: number;
  @Prop()
  url: string;
}

export const IGDBWebsitesSchema = SchemaFactory.createForClass(IGDBWebsites);
