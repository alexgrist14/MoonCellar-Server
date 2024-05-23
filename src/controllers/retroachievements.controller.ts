import { Controller, Get } from "@nestjs/common";
import { RetroAchievementsService } from "src/services/retroachievements.service";

@Controller('retroachievements')
export class RetroAchievementsController{
    constructor(private readonly retroachievementsService: RetroAchievementsService){}

    @Get('ps1')
    async getPS1Games(): Promise<string>{
        const games = await this.retroachievementsService.getPS1Games();
        await this.retroachievementsService.saveGamesToFile(games,'ps1.json');
        return 'PS1 games have been saved to ps1.json';
    }
}