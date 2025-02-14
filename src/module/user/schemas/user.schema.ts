import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MaxLength } from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Role } from 'src/module/roles/enums/role.enum';
import { IGDBGames } from 'src/shared/schemas/igdb-games.schema';
import { IRAAward } from '../types/award';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true, required: true })
  userName: string;

  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  profilePicture?: string;

  @Prop({ type: String })
  refreshToken?: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'User' }], default: [] })
  followings: mongoose.Types.ObjectId[];

  @Prop({
    type: {
      completed: [{ type: Number, ref: IGDBGames.name }],
      wishlist: [{ type: Number, ref: IGDBGames.name }],
      playing: [{ type: Number, ref: IGDBGames.name }],
      dropped: [{ type: Number, ref: IGDBGames.name }],
      backlog: [{ type: Number, ref: IGDBGames.name }],
      mastered: [{ type: Number, ref: IGDBGames.name }],
      played: [{ type: Number, ref: IGDBGames.name }],
    },
    ref: IGDBGames.name,
    default: {
      completed: [],
      wishlist: [],
      playing: [],
      dropped: [],
      backlog: [],
      played: [],
      mastered: [],
    },
  })
  games: {
    completed: number[];
    wishlist: number[];
    playing: number[];
    dropped: number[];
    backlog: number[];
    mastered: number[];
    played: number[];
  };

  @Prop({
    type: [
      {
        game: { type: Number, ref: IGDBGames.name, required: true },
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
  @MaxLength(450)
  description: string;
  @Prop()
  raUsername: string;
  @Prop()
  raAwards: IRAAward[];
  @Prop({ type: [{ type: String, enum: Role }], default: [Role.User] })
  roles: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);
