import { Injectable } from "@nestjs/common";
import { buildAuthorization, getGameList } from "@retroachievements/api";
import * as fs from 'fs';

@Injectable()
export class RetroAchievementsService{
    private readonly apiKey = 'C3NgxG63C0yL5F8Ef6x9FPxF3ratxO3D';
    private readonly userName = 'alexgrist14';

    constructor(){}
    
    async getPS1Games():Promise<any>{
        const userName = this.userName;
        const webApiKey = this.apiKey;
        const authorization = buildAuthorization({ userName, webApiKey });
        const platformId = 27;
        const gameList = await getGameList(authorization,{
            consoleId: platformId,
            shouldOnlyRetrieveGamesWithAchievements: false
        })

        return gameList;
    }

    async saveGamesToFile(games: any, filePath: string):Promise<void>{
        fs.writeFileSync(filePath,JSON.stringify(games,null,2));
    }
}