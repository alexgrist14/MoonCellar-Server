import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ParserType } from "../interface/common.interface";

export type IGDBSyncStateDocument = HydratedDocument<IGDBSyncState>;

@Schema()
export class IGDBSyncState {
  @Prop({ required: true, unique: true, type: String })
  parserType: ParserType;

  @Prop({ default: 0 })
  lastUpdatedAt: number;

  @Prop({ default: 0 })
  backfillUpdatedAt: number;

  @Prop({ default: false })
  backfillCompleted: boolean;

  @Prop()
  lastRunAt: string;

  @Prop()
  createdAt: string;

  @Prop()
  updatedAt: string;
}

export const IGDBSyncStateSchema =
  SchemaFactory.createForClass(IGDBSyncState);
