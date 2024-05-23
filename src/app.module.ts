import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RetroachievementsModule } from './module/retroachievements/retroachievements.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    //MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING),
    ConfigModule.forRoot(),
    RetroachievementsModule
  ],
})
export class AppModule {}
