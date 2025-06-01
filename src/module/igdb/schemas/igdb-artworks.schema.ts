import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IGDBArtworksDocument = HydratedDocument<IGDBArtworks>;

@Schema()
export class IGDBArtworks {
  @Prop()
  _id: number;
  @Prop()
  url: string;
  @Prop()
  width: number;
  @Prop()
  height: number;
}

export const IGDBArtworksSchema = SchemaFactory.createForClass(IGDBArtworks);
