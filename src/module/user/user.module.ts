import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../auth/schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { FileUploadService } from './services/file-upload.service';
import {
  IGDBGames,
  IGDBGamesSchema,
} from 'src/shared/schemas/igdb-games.schema';
import { UserFiltersService } from './services/user-filters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IGDBGames.name, schema: IGDBGamesSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],

  controllers: [UserController],
  providers: [UserService, UserFiltersService, FileUploadService],
})
export class UserModule {}
