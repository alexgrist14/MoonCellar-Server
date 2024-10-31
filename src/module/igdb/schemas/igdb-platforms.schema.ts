import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBPlatformsDocument = HydratedDocument<IGDBPlatforms>;

@Schema()
export class IGDBPlatforms {
  @Prop()
  id: number;
  @Prop()
  created_at: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop()
  platform_family: number;
  @Prop()
  platform_logo: number;
  @Prop()
  generation: number;
}

export const IGDBPlatformsSchema = SchemaFactory.createForClass(IGDBPlatforms);
