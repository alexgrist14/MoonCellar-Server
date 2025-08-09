import { Module } from "@nestjs/common";

import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./module/auth/auth.module";
import { UserModule } from "./module/user/user.module";
import { IgdbModule } from "./module/igdb/igdb.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { RetroachievementsModule } from "./module/retroach/retroach.module";
import { GamesModule } from "./module/games/games.module";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "@anatine/zod-nestjs";
import { AdminModule } from "./module/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING, {
      dbName: "games",
    }),
    AuthModule,
    UserModule,
    GamesModule,
    IgdbModule,
    AdminModule,
    RetroachievementsModule,
    ServeStaticModule.forRoot({
      rootPath: `/var/www/uploads/photos`,
      serveRoot: "/photos",
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
