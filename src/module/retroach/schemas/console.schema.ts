import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class RAConsole {
  @Prop()
  id: number;
  @Prop()
  name: string;
  @Prop()
  iconUrl: string;
  @Prop()
  igdbIds: number[];
}

export const RAConsoleSchema = SchemaFactory.createForClass(RAConsole);
