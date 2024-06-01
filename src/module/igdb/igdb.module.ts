import { Module } from '@nestjs/common';
import { IgdbService } from './igdb.service';
import { IgdbController } from './igdb.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IGDBGame, IGDBGameSchema } from './schemas/igdb-games.schema';
import { IGDBCovers, IGDBCoversSchema } from './schemas/igdb-covers.schema';

@Module({
  controllers: [IgdbController],
  providers: [IgdbService],
  imports: [
    MongooseModule.forFeature([
      { name: IGDBGame.name, schema: IGDBGameSchema },
      { name: IGDBCovers.name, schema: IGDBCoversSchema },
    ]),
  ],
})
export class IgdbModule {}
