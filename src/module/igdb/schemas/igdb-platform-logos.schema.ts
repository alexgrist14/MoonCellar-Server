import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBPlatformLogosDocument = HydratedDocument<IGDBPlatformLogos>;

@Schema()
export class IGDBPlatformLogos {
  @Prop()
  _id: number;
  @Prop()
  url: string;
  @Prop()
  width: number;
  @Prop()
  height: number;
}

export const IGDBPlatformLogosSchema =
  SchemaFactory.createForClass(IGDBPlatformLogos);
