import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBGameDocument = HydratedDocument<IGDBGame>;

@Schema()
export class IGDBGame {
  @Prop()
  id: number;
  @Prop()
  game_modes: number[];
  @Prop()
  genres: number[];
  @Prop()
  name: string;
  @Prop()
  platforms: number[];
  @Prop()
  slug: string;
  @Prop()
  tags: number[];
  @Prop()
  themes: number[];
  @Prop()
  url: string;
}

export const IGDBGameSchema = SchemaFactory.createForClass(IGDBGame);
