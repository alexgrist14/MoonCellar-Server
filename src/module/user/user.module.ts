import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "./schemas/user.schema";
import { UserProfileController } from "./controllers/user-profile.controller";
import { UserProfileService } from "./services/user-profile.service";
import {
  IGDBGames,
  IGDBGamesSchema,
} from "src/shared/schemas/igdb-games.schema";
import { UserFiltersService } from "./services/user-filters.service";
import { UserGamesService } from "./services/user-games.service";
import { UserFollowingsService } from "./services/user-followings.service";
import { UserFiltersController } from "./controllers/user-filters.controller";
import { UserFollowingsController } from "./controllers/user-followings.controller";
import { UserGamesController } from "./controllers/user-games.controller";
import { UserRAService } from "./services/user-ra.service";
import { UserRAController } from "./controllers/user-ra.controller";
import { UserPresetsService } from "./services/user-presets.service";
import { UserPresetsController } from "./controllers/user-presets.controller";
import { UserLogs, UserLogsSchema } from "./schemas/user-logs.schema";
import { UserLogsService } from "./services/user-logs.service";
import { UserLogsController } from "./controllers/user-logs.controller";
import { FileService } from "./services/file-upload.service";
import { FilesController } from "./controllers/files.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IGDBGames.name, schema: IGDBGamesSchema },
      { name: "User", schema: UserSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
    ]),
  ],

  controllers: [
    UserProfileController,
    UserFiltersController,
    UserPresetsController,
    UserFollowingsController,
    UserGamesController,
    UserRAController,
    UserLogsController,
    FilesController,
  ],
  providers: [
    UserProfileService,
    UserFiltersService,
    UserLogsService,
    UserPresetsService,
    FileService,
    UserGamesService,
    UserFollowingsService,
    UserRAService,
  ],
})
export class UserModule {}
