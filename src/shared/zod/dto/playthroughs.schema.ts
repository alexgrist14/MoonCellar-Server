import { createZodDto } from "@anatine/zod-nestjs";
import {
  GetPlaythroughsRequestSchema,
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
