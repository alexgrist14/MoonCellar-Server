import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export type ILogType = "list" | "custom" | "rating";

export class UserLogs extends Document {
  @Prop({
    type: {
      date: { type: Date, default: Date.now, required: false },
    },
  })
  date: Date;
  type: ILogType;
  text: string;
  // action: string;
  // isAdd: boolean;
  // rating?: number | undefined;
  gameId: number;
  @Prop({ ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
