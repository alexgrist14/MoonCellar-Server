import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/services/user.service';
import { FileUploadService } from '../user/services/file-upload.service';
import {
  IGDBGames,
  IGDBGamesSchema,
} from 'src/shared/schemas/igdb-games.schema';
import { UserFiltersService } from '../user/services/user-filters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: IGDBGames.name, schema: IGDBGamesSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<string | number>('JWT_EXPIRE'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserService,
    UserFiltersService,
    JwtStrategy,
    FileUploadService,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
