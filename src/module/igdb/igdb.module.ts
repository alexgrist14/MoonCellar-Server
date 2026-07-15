import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IGDBService } from "./igdb.service";
import { IgdbParserController } from "./controllers/igdb-parser.controller";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import { FileService } from "../user/services/file-upload.service";
import { HttpModule } from "@nestjs/axios";
import { SyncState, SyncStateSchema } from "../games/schemas/sync-state.schema";

@Module({
  controllers: [IgdbParserController],
  providers: [IGDBService, FileService],
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: SyncState.name, schema: SyncStateSchema },
    ]),
  ],
})
export class IgdbModule {}
