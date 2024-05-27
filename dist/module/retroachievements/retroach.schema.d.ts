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
import { Document } from 'mongoose';
export type GameDocument = RAGame & Document;
export declare class RAGame {
    title: string;
    id: number;
    consoleId: number;
    consoleName: string;
    imageIcon: string;
    numAchievements: number;
    numLeaderboards: number;
    points: number;
    dateModified: string;
    forumTopicId: number;
    hashes: string[];
}
export declare const RASchema: import("mongoose").Schema<RAGame, import("mongoose").Model<RAGame, any, any, any, Document<unknown, any, RAGame> & RAGame & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RAGame, Document<unknown, {}, import("mongoose").FlatRecord<RAGame>> & import("mongoose").FlatRecord<RAGame> & {
    _id: import("mongoose").Types.ObjectId;
}>;
