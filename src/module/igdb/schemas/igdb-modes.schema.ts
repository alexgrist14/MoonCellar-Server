import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBModesDocument = HydratedDocument<IGDBModes>;

@Schema()
export class IGDBModes {
  @Prop()
  _id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBModesSchema = SchemaFactory.createForClass(IGDBModes);
