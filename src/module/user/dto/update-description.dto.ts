import { ApiProperty } from "@nestjs/swagger";
import { MaxLength } from "class-validator";

export class UpdateDescriptionDto {
  @MaxLength(450)
  @ApiProperty({ example: "Some summary..." })
  description: string;
}
