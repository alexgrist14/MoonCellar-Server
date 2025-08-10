import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ILogType } from "../types/logs";
import { Game } from "src/module/games/schemas/game.schema";

export type UserLogsDocument = HydratedDocument<UserLogs>;

@Schema()
export class UserLogs {
  @Prop()
  date: Date;
  @Prop()
  type: ILogType;
  @Prop()
  text: string;
  @Prop({ ref: Game.name })
  gameId: mongoose.Types.ObjectId;
  @Prop({ ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
