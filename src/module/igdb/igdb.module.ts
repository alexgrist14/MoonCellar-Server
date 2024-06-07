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
import { IGDBGames, IGDBGamesSchema } from './schemas/igdb-games.schema';
import { IGDBService } from './igdb.service';
import { IGDBModes, IGDBModesSchema } from './schemas/igdb-modes.schema';
import { IgdbParserController } from './controllers/igdb-parser.controller';

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
    ]),
  ],
})
export class IgdbModule {}
