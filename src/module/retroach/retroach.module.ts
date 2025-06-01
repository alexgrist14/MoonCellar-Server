import { Module } from "@nestjs/common";
import { RetroachievementsService } from "./services/retroach.service";
import { RetroachievementsController } from "./controllers/retroach.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { RAGame, RASchema } from "./schemas/retroach.schema";
import { RAConsole, RAConsoleSchema } from "./schemas/console.schema";
import {
  IGDBGames,
  IGDBGamesSchema,
} from "src/shared/schemas/igdb-games.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RAGame.name, schema: RASchema }]),
    MongooseModule.forFeature([
      { name: RAConsole.name, schema: RAConsoleSchema },
    ]),
    MongooseModule.forFeature([
      { name: IGDBGames.name, schema: IGDBGamesSchema },
    ]),
  ],

  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
