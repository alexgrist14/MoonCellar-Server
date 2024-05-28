import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { RAGame, RASchema } from 'src/module/retroachievements/schemas/retroach.schema';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true })
  name: string;
  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ type: String })
  refreshToken?: string;
  @Prop({ type: [Types.ObjectId], ref: "RAgame", default: [] })
  games: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
