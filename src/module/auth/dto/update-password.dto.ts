import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MinLength } from "class-validator";

export class UpdatePasswordDto{
    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty({example: "123456"})
    oldPassword: string;

    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty({example: "123456789"})
    newPassword: string;
}