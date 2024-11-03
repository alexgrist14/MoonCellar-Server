import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IGDBGames } from 'src/shared/schemas/igdb-games.schema';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true, required: true })
  name: string;
  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop()
  profilePicture?: string;
  @Prop({ type: String })
  refreshToken?: string;
  @Prop({
    type: {
      completed: [{ type: Number, ref: IGDBGames.name }],
      wishlist: [{ type: Number, ref: IGDBGames.name }],
      playing: [{ type: Number, ref: IGDBGames.name }],
      dropped: [{ type: Number, ref: IGDBGames.name }],
    },
    ref: IGDBGames.name,
    default: {
      completed: [],
      wishlist: [],
      playing: [],
      dropped: [],
    },
  })
  games: {
    completed: number[];
    wishlist: number[];
    playing: number[];
    dropped: number[];
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
        gameId: { type: String, required: true },
      },
    ],
    default: [],
  })
  logs: {
    date: Date;
    action: string;
    gameId: string;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
