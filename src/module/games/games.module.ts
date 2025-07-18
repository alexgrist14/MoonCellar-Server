import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  GamesPlaythroughs,
  IGamesPlaythroughsSchema,
} from "./schemas/games-playthroughs.schema";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { UserLogsService } from "../user/services/user-logs.service";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import {
  IGDBPlatforms,
  IGDBPlatformsSchema,
} from "../igdb/schemas/igdb-platforms.schema";

@Module({
  controllers: [GamesController],
  providers: [GamesService, UserLogsService],
  imports: [
    MongooseModule.forFeature([
      { name: GamesPlaythroughs.name, schema: IGamesPlaythroughsSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: IGDBPlatforms.name, schema: IGDBPlatformsSchema },
    ]),
  ],
})
export class GamesModule {}
