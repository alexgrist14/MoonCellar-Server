import { Document } from 'mongoose';

export interface IGDBGame extends Document {
  readonly id: number;
  readonly game_modes: number[];
  readonly genres: number[];
  readonly name: string;
  readonly platforms: number[];
  readonly slug: string;
  readonly tags: number[];
  readonly themes: number[];
  readonly url: string;
}

