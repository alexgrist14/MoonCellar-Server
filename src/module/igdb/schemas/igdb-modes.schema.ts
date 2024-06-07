import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IGDBModeINT } from '../interface/scheme.interface';

export type IGDBModesDocument = HydratedDocument<IGDBModeINT>;

@Schema()
export class IGDBModes {
  @Prop()
  id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBModesSchema = SchemaFactory.createForClass(IGDBModes);
