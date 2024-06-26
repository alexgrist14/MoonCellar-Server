import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../auth/schemas/user.schema';
import { RAGame, RASchema } from '../retroachievements/schemas/retroach.schema';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RAGame.name, schema: RASchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],

  controllers: [UserController],
  providers: [UserService, FileUploadService],
})
export class UserModule {}
