import { createZodDto } from "@anatine/zod-nestjs";
import {
  GetPlaythroughsRequestSchema,
  PlaythoughFullResponseSchema,
  PlaythoughMinimalResponseSchema,
  PlaythoughsMinimalResponseSchema,
  PlaythoughsResponseSchema,
  SavePlaythroughRequestSchema,
  UpdatePlaythroughRequestSchema,
} from "../schemas/playthroughs.schema";

export class GetPlaythroughsRequestDto extends createZodDto(
  GetPlaythroughsRequestSchema
) {}

export class SavePlaythroughRequestDto extends createZodDto(
  SavePlaythroughRequestSchema
) {}

export class UpdatePlaythroughsRequestDto extends createZodDto(
  UpdatePlaythroughRequestSchema
) {}

export class GetPlaythroughsResponseDto extends createZodDto(
  PlaythoughsResponseSchema
) {}

export class GetPlaythroughsMinimalResponseDto extends createZodDto(
  PlaythoughsMinimalResponseSchema
) {}

export class GetPlaythroughFullResponseDto extends createZodDto(
  PlaythoughFullResponseSchema
) {}

export class GetPlaythroughMinimalResponseDto extends createZodDto(
  PlaythoughMinimalResponseSchema
) {}
