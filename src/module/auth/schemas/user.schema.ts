import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  @Prop({
    type: {
      completed: [{ type: String, ref: 'RAGame' }],
      wishlist: [{ type: String, ref: 'RAGame' }],
      playing: [{ type: String, ref: 'RAGame' }],
      dropped: [{ type: String, ref: 'RAGame' }],
    },
    ref: 'RAgame',
    default: {
      completed: [],
      wishlist: [],
      playing: [],
      dropped: [],
    },
  })
  games: {
    completed: string[];
    wishlist: string[];
    playing: string[];
    dropped: string[];
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
