import { createZodDto } from "@anatine/zod-nestjs";
import { GetGamesByIdsSchema } from "../schemas/games.schema";

export class GetGamesByIdsDto extends createZodDto(GetGamesByIdsSchema) {}
