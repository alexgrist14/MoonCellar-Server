import { ApiProperty } from "@nestjs/swagger";

export class ParseImagesDto {
  @ApiProperty({
    enum: ["covers", "artworks", "screenshots"],
    isArray: true,
    example: ["covers", "screenshots"],
    description: "Which image types to parse",
  })
  parseTypes: ("covers" | "artworks" | "screenshots")[];
}
