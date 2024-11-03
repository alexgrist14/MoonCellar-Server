import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AddGameRatingDto {
  @IsNotEmpty()
  @ApiProperty({ example: 131913 })
  game: number;
  @IsNotEmpty()
  @ApiProperty({ example: 9 })
  rating: number;
}
