import { RetroachievementsService } from './retroach.service';
import { RAGame } from './retroach.schema';
export declare class RetroachievementsController {
    private readonly retroachievementsService;
    constructor(retroachievementsService: RetroachievementsService);
    getGamesByPlatform(id: number): Promise<RAGame[]>;
    getAllGames(): Promise<RAGame[]>;
}
