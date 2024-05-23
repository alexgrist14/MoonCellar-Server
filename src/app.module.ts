import { Module } from '@nestjs/common';
import { retroachievementsModule } from './modules/retroachievements.module';

@Module({
  imports: [retroachievementsModule],
})
export class AppModule {}
