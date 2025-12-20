import { createZodDto } from "@anatine/zod-nestjs";
import { ParseImagesSchema } from "../schemas/igdb.schema";

export class ParseImagesDto extends createZodDto(ParseImagesSchema) {}
