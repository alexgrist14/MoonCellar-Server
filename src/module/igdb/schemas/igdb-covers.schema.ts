import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IGDBCoverINT } from '../interface/scheme.interface';

export type IGDBCoverDocument = HydratedDocument<IGDBCoverINT>;

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
