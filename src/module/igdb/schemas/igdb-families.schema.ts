import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IGDBFamilyINT } from '../interface/scheme.interface';

export type IGDBFamiliesDocument = HydratedDocument<IGDBFamilyINT>;

@Schema()
export class IGDBFamilies {
  @Prop()
  id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBFamiliesSchema = SchemaFactory.createForClass(IGDBFamilies);
