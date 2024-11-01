import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBKeywordsDocument = HydratedDocument<IGDBKeywords>;

@Schema()
export class IGDBKeywords {
  @Prop()
  _id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBKeywordsSchema = SchemaFactory.createForClass(IGDBKeywords);
