import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MaxLength } from "class-validator";
import mongoose, { Document } from "mongoose";
import { IRAAward } from "src/shared/zod/schemas/ra.schema";
import { IRole } from "src/shared/zod/schemas/role.schema";

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true, required: true })
  userName: string;
  @Prop({ unique: [true, "Duplicate email entered"] })
  email: string;
  @Prop()
  password: string;
  @Prop()
  refreshToken?: string;
  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] })
  followings: mongoose.Types.ObjectId[];
  @Prop()
  filters: { name: string; filter: string }[];
  @Prop()
  presets: { name: string; preset: string }[];
  @Prop()
  @MaxLength(450)
  description?: string;
  @Prop()
  raUsername?: string;
  @Prop()
  raAwards: IRAAward[];
  @Prop({ default: ["user"] })
  roles: IRole[];
  @Prop()
  avatar: string;
  @Prop()
  background: string;
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
