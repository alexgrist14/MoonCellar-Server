import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IGDBGenreINT } from '../interface/scheme.interface';

export type IGDBGenresDocument = HydratedDocument<IGDBGenreINT>;

@Schema()
export class IGDBGenres {
  @Prop()
  id: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop()
  url: string;
}

export const IGDBGenresSchema = SchemaFactory.createForClass(IGDBGenres);
