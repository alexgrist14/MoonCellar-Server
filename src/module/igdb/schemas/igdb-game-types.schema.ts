import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IGDBGameTypesDocument = HydratedDocument<IGDBGameTypes>;

@Schema()
export class IGDBGameTypes {
  @Prop()
  _id: number;
  @Prop()
  type: string;
}

export const IGDBGameTypesSchema = SchemaFactory.createForClass(IGDBGameTypes);
