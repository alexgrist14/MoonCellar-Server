import { Module } from '@nestjs/common';
import { IgdbController } from './controllers/igdb.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IGDBCovers, IGDBCoversSchema } from './schemas/igdb-covers.schema';
import { IGDBGenres, IGDBGenresSchema } from './schemas/igdb-genres.schema';
import {
  IGDBFamilies,
  IGDBFamiliesSchema,
} from './schemas/igdb-families.schema';
import {
  IGDBPlatforms,
  IGDBPlatformsSchema,
} from './schemas/igdb-platforms.schema';
import { IGDBService } from './igdb.service';
import { IGDBModes, IGDBModesSchema } from './schemas/igdb-modes.schema';
import { IgdbParserController } from './controllers/igdb-parser.controller';
import {
  IGDBKeywords,
  IGDBKeywordsSchema,
} from './schemas/igdb-keywords.schema';
import {
  IGDBScreenshots,
  IGDBScreenshotsSchema,
} from './schemas/igdb-screenshots.schema';
import {
  IGDBArtworks,
  IGDBArtworksSchema,
} from './schemas/igdb-artworks.schema';
import { IGDBThemes, IGDBThemesSchema } from './schemas/igdb-themes.schema';
import {
  IGDBPlatformLogos,
  IGDBPlatformLogosSchema,
} from './schemas/igdb-platform-logos.schema';
import {
  IGDBGames,
  IGDBGamesSchema,
} from 'src/shared/schemas/igdb-games.schema';
import {
  IGDBWebsites,
  IGDBWebsitesSchema,
} from './schemas/igdb-websites.schema';
import {
  IGDBInvolvedCompanies,
  IGDBInvolvedCompaniesSchema,
} from './schemas/igdb-involved-companies.schema';
import {
  IGDBCompanies,
  IGDBCompaniesSchema,
} from './schemas/igdb-companies.schema';
import {
  IGDBReleaseDates,
  IGDBReleaseDatesSchema,
} from './schemas/igdb-release-dates.schema';

@Module({
  controllers: [IgdbController, IgdbParserController],
  providers: [IGDBService],
  imports: [
    MongooseModule.forFeature([
      { name: IGDBGames.name, schema: IGDBGamesSchema },
      { name: IGDBCovers.name, schema: IGDBCoversSchema },
      { name: IGDBGenres.name, schema: IGDBGenresSchema },
      { name: IGDBFamilies.name, schema: IGDBFamiliesSchema },
      { name: IGDBPlatforms.name, schema: IGDBPlatformsSchema },
      { name: IGDBModes.name, schema: IGDBModesSchema },
      { name: IGDBKeywords.name, schema: IGDBKeywordsSchema },
      { name: IGDBThemes.name, schema: IGDBThemesSchema },
      { name: IGDBScreenshots.name, schema: IGDBScreenshotsSchema },
      { name: IGDBArtworks.name, schema: IGDBArtworksSchema },
      { name: IGDBPlatformLogos.name, schema: IGDBPlatformLogosSchema },
      { name: IGDBWebsites.name, schema: IGDBWebsitesSchema },
      { name: IGDBInvolvedCompanies.name, schema: IGDBInvolvedCompaniesSchema },
      { name: IGDBCompanies.name, schema: IGDBCompaniesSchema },
      { name: IGDBReleaseDates.name, schema: IGDBReleaseDatesSchema },
    ]),
  ],
})
export class IgdbModule {}
