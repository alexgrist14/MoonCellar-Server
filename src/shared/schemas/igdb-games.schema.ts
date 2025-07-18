import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IGDBArtworks } from "src/module/igdb/schemas/igdb-artworks.schema";
import { IGDBCovers } from "src/module/igdb/schemas/igdb-covers.schema";
import { IGDBGenres } from "src/module/igdb/schemas/igdb-genres.schema";
import { IGDBInvolvedCompanies } from "src/module/igdb/schemas/igdb-involved-companies.schema";
import { IGDBKeywords } from "src/module/igdb/schemas/igdb-keywords.schema";
import { IGDBModes } from "src/module/igdb/schemas/igdb-modes.schema";
import { IGDBPlatforms } from "src/module/igdb/schemas/igdb-platforms.schema";
import { IGDBReleaseDates } from "src/module/igdb/schemas/igdb-release-dates.schema";
import { IGDBScreenshots } from "src/module/igdb/schemas/igdb-screenshots.schema";
import { IGDBThemes } from "src/module/igdb/schemas/igdb-themes.schema";
import { IGDBWebsites } from "src/module/igdb/schemas/igdb-websites.schema";
import { RAGame, RASchema } from "src/module/retroach/schemas/retroach.schema";

export type IGDBGamesDocument = HydratedDocument<IGDBGames>;

@Schema()
export class IGDBGames {
  @Prop()
  _id: number;
  @Prop({ ref: IGDBModes.name })
  game_modes: number[];
  @Prop({ ref: IGDBGenres.name })
  genres: number[];
  @Prop()
  name: string;
  @Prop({ ref: IGDBPlatforms.name })
  platforms: number[];
  @Prop()
  slug: string;
  @Prop()
  url: string;
  @Prop({ ref: IGDBKeywords.name })
  keywords: number[];
  @Prop({ ref: IGDBThemes.name })
  themes: number[];
  @Prop({ ref: IGDBCovers.name })
  cover: number[];
  @Prop({ ref: IGDBScreenshots.name })
  screenshots: number[];
  @Prop()
  total_rating: number;
  @Prop()
  total_rating_count: number;
  @Prop()
  aggregated_rating: number;
  @Prop()
  game_type: number;
  @Prop()
  category: number;
  @Prop({ ref: IGDBArtworks.name })
  artworks: number[];
  @Prop()
  storyline: string;
  @Prop()
  summary: string;
  @Prop()
  first_release_date: number;
  @Prop({ ref: IGDBInvolvedCompanies.name })
  involved_companies: number[];
  @Prop({ ref: IGDBWebsites.name })
  websites: number[];
  @Prop({ ref: IGDBReleaseDates.name })
  release_dates: number[];
  @Prop({ ref: RAGame.name })
  raIds: number[];
}

export const IGDBGamesSchema = SchemaFactory.createForClass(IGDBGames);
