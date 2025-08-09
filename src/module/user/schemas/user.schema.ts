import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MaxLength } from "class-validator";
import mongoose, { Document } from "mongoose";
import { IRAAward } from "../types/award";
import { IRole, RoleSchema } from "src/shared/zod/schemas/role.schema";

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true, required: true })
  userName: string;

  @Prop({ unique: [true, "Duplicate email entered"] })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: "" })
  profilePicture?: string;
  @Prop()
  background?: string;

  @Prop({ type: String })
  refreshToken?: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] })
  followings: mongoose.Types.ObjectId[];

  @Prop({
    type: [
      {
        game: { type: Number, required: true },
        rating: { type: Number, required: true },
      },
    ],
    default: [],
  })
  gamesRating: {
    game: number;
    rating: number;
  }[];

  @Prop({
    type: [
      {
        date: { type: Date, default: Date.now, required: false },
        action: { type: String, required: true },
        isAdd: { type: Boolean, required: true },
        rating: { type: Number, required: false },
        gameId: { type: Number, required: true },
      },
    ],
    default: [],
  })
  logs: {
    date: Date;
    action: string;
    isAdd: boolean;
    rating?: number | undefined;
    gameId: number;
  }[];
  @Prop()
  filters: { name: string; filter: string }[];
  @Prop()
  presets: { name: string; preset: string }[];
  @Prop()
  @MaxLength(450)
  description: string;
  @Prop()
  raUsername: string;
  @Prop()
  raAwards: IRAAward[];
  @Prop({ default: ["user"] })
  roles: IRole[];
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
