import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IGDBCompanies } from "./igdb-companies.schema";

export type IGDBInvolvedCompaniesDocument =
  HydratedDocument<IGDBInvolvedCompanies>;

@Schema()
export class IGDBInvolvedCompanies {
  @Prop()
  _id: number;
  @Prop({ ref: IGDBCompanies.name })
  company: number;
  @Prop()
  developer: boolean;
  @Prop()
  porting: boolean;
  @Prop()
  publisher: boolean;
  @Prop()
  supporting: boolean;
}

export const IGDBInvolvedCompaniesSchema = SchemaFactory.createForClass(
  IGDBInvolvedCompanies
);
