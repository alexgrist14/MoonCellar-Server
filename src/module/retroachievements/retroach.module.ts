import { Module } from '@nestjs/common';
import { RetroachievementsService } from './retroach.service';
import { RetroachievementsController } from './retroach.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RAGame, RASchema } from './retroach.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RAGame.name, schema: RASchema }]),
  ],
  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
