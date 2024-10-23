import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

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
  @Prop({ ref: 'IGDBFamilies' })
  platform_family: mongoose.Schema.Types.ObjectId;
  @Prop({ ref: 'IGDBPlatformLogos' })
  platform_logo: mongoose.Schema.Types.ObjectId;
  @Prop()
  generation: number;
}

export const IGDBPlatformsSchema = SchemaFactory.createForClass(IGDBPlatforms);
