import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBCoverDocument = HydratedDocument<IGDBCovers>;

@Schema()
export class IGDBCovers {
  @Prop()
  id: number;
  @Prop()
  game: string;
  @Prop()
  url: string;
}

export const IGDBCoversSchema = SchemaFactory.createForClass(IGDBCovers);
