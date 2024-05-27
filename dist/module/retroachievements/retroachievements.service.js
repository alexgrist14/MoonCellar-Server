"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetroachievementsService = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@retroachievements/api");
const fs = require("fs");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const game_schema_1 = require("../game/game.schema");
const mongoose_2 = require("mongoose");
let RetroachievementsService = class RetroachievementsService {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.apiKey = process.env.RETROACHIEVEMENTS_API_KEY;
        this.userName = 'alexgrist14';
        this.platforms = [...Array(78).keys()].map((i) => i + 1);
    }
    async saveGamesToDatabase(platformId, games) {
        const gameDocuments = games.map((game) => ({
            ...game,
            platformId,
        }));
        await this.gameModel.insertMany(gameDocuments);
    }
    async getGamesByPlatform(id) {
        const gamesData = fs.readFileSync('games.json', 'utf-8');
        const games = JSON.parse(gamesData);
        const platformGames = games[id];
        if (!platformGames) {
            return `No games found for platform with ID ${id}`;
        }
        return JSON.stringify(platformGames);
    }
    async getGamesForPlatform(platformId) {
        const userName = this.userName;
        const webApiKey = this.apiKey;
        const authorization = (0, api_1.buildAuthorization)({ userName, webApiKey });
        const gameList = (await (0, api_1.getGameList)(authorization, {
            consoleId: platformId,
            shouldOnlyRetrieveGamesWithAchievements: false,
        }));
        return gameList;
    }
    async getGamesForPlatformWithDelay(platformId, delay = 400) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getGamesForPlatform(platformId);
    }
    async saveGamesToFile(games, filePath) {
        fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
    }
    async onModuleInit() {
    }
    async handleCron() {
        const allGames = {};
        for (const platformId of this.platforms) {
            try {
                console.log(platformId);
                const games = await this.getGamesForPlatformWithDelay(platformId);
                await this.saveGamesToDatabase(platformId, games);
                allGames[platformId] = games;
            }
            catch (error) {
                console.error(`Failed to fetch games for platform ${platformId}:`, error);
            }
        }
        console.log('Games have been saved to games.json');
    }
    async findGamesByPlatform(platformId) {
        return this.gameModel.find();
    }
};
exports.RetroachievementsService = RetroachievementsService;
__decorate([
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RetroachievementsService.prototype, "getGamesByPlatform", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RetroachievementsService.prototype, "handleCron", null);
exports.RetroachievementsService = RetroachievementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(game_schema_1.Game.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RetroachievementsService);
//# sourceMappingURL=retroachievements.service.js.map