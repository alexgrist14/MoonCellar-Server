import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IGDBCompaniesDocument = HydratedDocument<IGDBCompanies>;

@Schema()
export class IGDBCompanies {
  @Prop()
  _id: number;
  @Prop()
  logo: number;
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop()
  description: string;
  @Prop()
  country: number;
  @Prop()
  developed: number[];
  @Prop()
  published: number[];
  @Prop()
  url: string;
  @Prop()
  start_date: string;
}

export const IGDBCompaniesSchema = SchemaFactory.createForClass(IGDBCompanies);
