import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBGenresDocument = HydratedDocument<IGDBGenres>;

@Schema()
export class IGDBGenres {
  @Prop()
  _id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop()
  url: string;
}

export const IGDBGenresSchema = SchemaFactory.createForClass(IGDBGenres);
