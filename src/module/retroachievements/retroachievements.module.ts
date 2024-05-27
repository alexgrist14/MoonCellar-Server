import { Module } from '@nestjs/common';
import { RetroachievementsService } from './retroachievements.service';
import { RetroachievementsController } from './retroachievements.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from '../game/game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
  ],
  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
