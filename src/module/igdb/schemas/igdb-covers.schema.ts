import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IGDBCover } from 'src/models/igdb';

export type IGDBCoverDocument = HydratedDocument<IGDBCover>;

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
