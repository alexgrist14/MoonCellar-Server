import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "../user/schemas/user.schema";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { UserProfileController } from "../user/controllers/user-profile.controller";
import { UserProfileService } from "../user/services/user-profile.service";
import {
  IGDBGames,
  IGDBGamesSchema,
} from "src/shared/schemas/igdb-games.schema";
import { UserFiltersService } from "../user/services/user-filters.service";
import { UserFollowingsService } from "../user/services/user-followings.service";
import { UserGamesService } from "../user/services/user-games.service";
import { UserLogsService } from "../user/services/user-logs.service";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import { JwtRefreshStrategy } from "./jwt-refresh.strategy";
import { FileService } from "../user/services/file-upload.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "User", schema: UserSchema },
      { name: IGDBGames.name, schema: IGDBGamesSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
    ]),

    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>("JWT_SECRET"),
          signOptions: {
            expiresIn: config.get<string | number>("JWT_EXPIRE"),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UserProfileController],
  providers: [
    AuthService,
    UserProfileService,
    UserLogsService,
    UserFiltersService,
    UserFollowingsService,
    UserGamesService,
    JwtStrategy,
    JwtRefreshStrategy,
    FileService,
  ],
  exports: [JwtStrategy, JwtRefreshStrategy, PassportModule],
})
export class AuthModule {}
