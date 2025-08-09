import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MaxLength } from "class-validator";
import mongoose, { Document } from "mongoose";
import { Role } from "src/module/roles/enums/role.enum";
import { IRAAward } from "../types/award";

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
  @Prop({ type: String })
  refreshToken?: string;
  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] })
  followings: mongoose.Types.ObjectId[];
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
  @Prop({ type: [{ type: String, enum: Role }], default: [Role.User] })
  roles: Role[];
  @Prop()
  avatar: string;
  @Prop()
  background: string;
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
