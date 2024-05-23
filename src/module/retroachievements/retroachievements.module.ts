import { Module } from '@nestjs/common';
import { RetroachievementsService } from './retroachievements.service';
import { RetroachievementsController } from './retroachievements.controller';

@Module({
  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
