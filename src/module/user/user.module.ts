import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserProfileService } from './services/user-profile.service';
import { FileUploadService } from './services/file-upload.service';
import {
  IGDBGames,
  IGDBGamesSchema,
} from 'src/shared/schemas/igdb-games.schema';
import { UserFiltersService } from './services/user-filters.service';
import { UserGamesService } from './services/user-games.service';
import { UserFollowingsService } from './services/user-followings.service';
import { UserFiltersController } from './controllers/user-filters.controller';
import { UserFollowingsController } from './controllers/user-followings.controller';
import { UserGamesController } from './controllers/user-games.controller';
import { UserRAService } from './services/user-ra.service';
import { UserRAController } from './controllers/user-ra.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IGDBGames.name, schema: IGDBGamesSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],

  controllers: [
    UserProfileController,
    UserFiltersController,
    UserFollowingsController,
    UserGamesController,
    UserRAController,
  ],
  providers: [
    UserProfileService,
    UserFiltersService,
    FileUploadService,
    UserGamesService,
    UserFollowingsService,
    UserRAService,
  ],
})
export class UserModule {}
