import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export class UserLogs extends Document {
  @Prop({
    type: {
      date: { type: Date, default: Date.now, required: false },
    },
  })
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number | undefined;
  gameId: number;
  @Prop({ type: mongoose.Types.ObjectId, ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
