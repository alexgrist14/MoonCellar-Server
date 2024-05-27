import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RetroachievementsModule } from './module/retroachievements/retroach.module';
import { UserModule } from './module/user/user.module';
import { BookModule } from './module/book/book.module';
import { AuthModule } from './module/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING, {
      dbName: 'games',
    }),
    RetroachievementsModule,
    UserModule,
    BookModule,
    AuthModule,
  ],
})
export class AppModule {}
