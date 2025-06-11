import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  GamesPlaythroughs,
  IGamesPlaythroughsSchema,
} from "./schemas/games-playthroughs.schema";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { User, UserSchema } from "../user/schemas/user.schema";

@Module({
  controllers: [GamesController],
  providers: [GamesService],
  imports: [
    MongooseModule.forFeature([
      { name: GamesPlaythroughs.name, schema: IGamesPlaythroughsSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
})
export class GamesModule {}
