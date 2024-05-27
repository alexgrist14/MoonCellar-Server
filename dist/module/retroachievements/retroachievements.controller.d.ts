import { RetroachievementsService } from './retroachievements.service';
import { Game } from '../game/game.schema';
export declare class RetroachievementsController {
    private readonly retroachievementsService;
    constructor(retroachievementsService: RetroachievementsService);
    getGamesByPlatform(id: number): Promise<Game[]>;
}
