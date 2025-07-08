import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserTimeDto {
  @ApiProperty({ example: "2024-11-11T13:26:13.833+00:00" })
  updateAt: Date;
}
