import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IGDBFamilies } from "./igdb-families.schema";
import { IGDBPlatformLogos } from "./igdb-platform-logos.schema";

export type IGDBPlatformsDocument = HydratedDocument<IGDBPlatforms>;

@Schema()
export class IGDBPlatforms {
  @Prop()
  _id: number;
  @Prop()
  created_at: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop({ ref: IGDBFamilies.name })
  platform_family: number;
  @Prop({ ref: IGDBPlatformLogos.name })
  platform_logo: number;
  @Prop()
  generation: number;
}

export const IGDBPlatformsSchema = SchemaFactory.createForClass(IGDBPlatforms);
