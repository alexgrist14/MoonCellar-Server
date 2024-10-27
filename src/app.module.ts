import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RetroachievementsModule } from './module/retroachievements/retroach.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { IgdbModule } from './module/igdb/igdb.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING, {
      dbName: 'games',
    }),
    RetroachievementsModule,
    AuthModule,
    UserModule,
    IgdbModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'uploads/photos'),
      serveRoot: '/photos'
    })
  ],
})
export class AppModule {}
