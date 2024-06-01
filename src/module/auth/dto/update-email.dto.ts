import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'newemail@gmail.com' })
  newEmail: string;
}
