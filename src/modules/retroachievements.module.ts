import { Module } from "@nestjs/common";
import { RetroAchievementsController } from "src/controllers/retroachievements.controller";
import { RetroAchievementsService } from "src/services/retroachievements.service";

@Module({
    controllers:[RetroAchievementsController],
    providers: [RetroAchievementsService],
})

export class retroachievementsModule{}