import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBThemesDocument = HydratedDocument<IGDBThemes>;

@Schema()
export class IGDBThemes {
  @Prop()
  id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
}

export const IGDBThemesSchema = SchemaFactory.createForClass(IGDBThemes);
