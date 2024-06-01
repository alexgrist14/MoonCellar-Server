import { Module } from '@nestjs/common';
import { RetroachievementsService } from './retroach.service';
import { RetroachievementsController } from './controllers/retroach.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RAGame, RASchema } from './schemas/retroach.schema';
import { RAConsolesController } from './controllers/console.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RAGame.name, schema: RASchema }]),
  ],

  controllers: [RetroachievementsController, RAConsolesController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
