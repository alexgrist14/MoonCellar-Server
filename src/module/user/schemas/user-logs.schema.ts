import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { ILogType } from "../types/logs";

export class UserLogs extends Document {
  @Prop({
    type: {
      date: { type: Date, default: Date.now, required: false },
    },
  })
  date: Date;
  @Prop()
  type: ILogType;
  @Prop()
  text: string;
  @Prop()
  gameId: number;
  @Prop({ ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
