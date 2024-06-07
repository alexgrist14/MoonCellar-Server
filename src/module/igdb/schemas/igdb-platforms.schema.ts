import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IGDBPlatformINT } from '../interface/scheme.interface';

export type IGDBPlatformsDocument = HydratedDocument<IGDBPlatformINT>;

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
  @Prop()
  platform_logo: number;
  @Prop()
  generation: number;
}

export const IGDBPlatformsSchema = SchemaFactory.createForClass(IGDBPlatforms);
