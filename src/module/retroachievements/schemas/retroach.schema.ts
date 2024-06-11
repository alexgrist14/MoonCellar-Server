import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class RAGame {
  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  id: number;
  @Prop({ ref: 'RAConsoles' })
  consoleId: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  consoleName: string;
  @Prop({ required: true })
  imageIcon: string;
  @Prop({ required: true })
  numAchievements: number;
}

export const RASchema = SchemaFactory.createForClass(RAGame);
