import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserLogsService } from "../user/services/user-logs.service";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import { PlaythroughsService } from "./services/playthroughs.service";
import { GamesController } from "./controllers/games.controller";
import { PlaythroughsController } from "./controllers/playthorughs.controller";
import { Platform, PlatformDatabaseSchema } from "./schemas/platform.schema";
import { Game, GameDatabaseSchema } from "./schemas/game.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "./schemas/playthroughs.schema";
import { FileService } from "../user/services/file-upload.service";
import { PlatformsController } from "./controllers/platforms.controller";
import { PlatformsService } from "./services/platforms.service";
import { GamesService } from "./services/games.service";
import { HltbService } from "./services/hltb.service";
import { HltbController } from "./controllers/hltb.controller";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  controllers: [
    GamesController,
    PlaythroughsController,
    PlatformsController,
    HltbController,
  ],
  providers: [
    GamesService,
    HltbService,
    PlaythroughsService,
    UserLogsService,
    FileService,
    PlatformsService,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
    ]),
    MetricsModule,
  ],
})
export class GamesModule {}
