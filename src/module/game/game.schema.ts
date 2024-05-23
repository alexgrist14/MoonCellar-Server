import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema()
export class Game{
    @Prop({required: true})
    title: string;
    @Prop({required: true})
    id: number;
    @Prop({required: true})
    consoleId: number;
    @Prop({required: true})
    consoleName: string;
    @Prop({required: true})
    imageIcon: string;
    @Prop({required: true})
    numAchievements: number;
    @Prop()
    numLeaderboards: number;
    @Prop()
    points: number;
    @Prop()
    dateModified: string;
    @Prop()
    forumTopicId: number;
    @Prop()
    hashes: string[];
}

export const GameSchema = SchemaFactory.createForClass(Game);