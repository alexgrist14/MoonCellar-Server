import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBCoverDocument = HydratedDocument<IGDBCovers>;

@Schema()
export class IGDBCovers {
  @Prop()
  _id: number;
  @Prop()
  game: string;
  @Prop()
  url: string;
  @Prop()
  width: number;
  @Prop()
  height: number;
}

export const IGDBCoversSchema = SchemaFactory.createForClass(IGDBCovers);
