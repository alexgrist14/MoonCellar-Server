/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
/// <reference types="mongoose/types/inferrawdoctype" />
import { Game, GameDocument } from '../game/game.schema';
import { Model } from 'mongoose';
import { IGame } from './interfaces/game.interface';
import { IDataBase } from './interfaces/retroachievements.interface';
export declare class RetroachievementsService {
    private gameModel;
    private readonly apiKey;
    private readonly userName;
    private readonly platforms;
    constructor(gameModel: Model<GameDocument>);
    saveGamesToDatabase(platformId: number, games: IGame[]): Promise<void>;
    getGamesByPlatform(id: string): Promise<string>;
    getGamesForPlatform(platformId: number): Promise<IGame[]>;
    getGamesForPlatformWithDelay(platformId: number, delay?: number): Promise<IGame[]>;
    saveGamesToFile(games: IDataBase, filePath: string): Promise<void>;
    onModuleInit(): Promise<void>;
    handleCron(): Promise<void>;
    findGamesByPlatform(platformId: number): Promise<Game[]>;
}
