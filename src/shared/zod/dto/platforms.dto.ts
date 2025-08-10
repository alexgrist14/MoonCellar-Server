import { createZodDto } from "@anatine/zod-nestjs";
import { PlatformSchema } from "../schemas/platforms.schema";

export class PlatformResponseDto extends createZodDto(PlatformSchema) {}
