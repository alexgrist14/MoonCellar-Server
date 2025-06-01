import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import mongoose from "mongoose";

export class SavePlaythroughDTO {
  @ApiProperty()
  userId: mongoose.Types.ObjectId;
  @ApiPropertyOptional()
  dateStart: string;
  @ApiProperty()
  dateEnd: string;
  @ApiPropertyOptional()
  timeMinutes: number;
  @ApiPropertyOptional()
  comment: string;
  @ApiProperty()
  gameId: number;
  @ApiProperty()
  platformId: number;
  @ApiProperty()
  IGDBReleaseDateId: number;
  @ApiPropertyOptional()
  isMastered: boolean;
}
