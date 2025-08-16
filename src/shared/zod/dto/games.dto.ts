import { createZodDto } from "@anatine/zod-nestjs";
import {
  AddGameRequestSchema,
  GameSchema,
  GetGameByIdSchema,
  GetGameBySlugSchema,
  GetGamesByIdsSchema,
  GetGamesRequestSchema,
  UpdateGameRequestSchema,
} from "../schemas/games.schema";

export class GetGameByIdDto extends createZodDto(GetGameByIdSchema) {}
export class GetGameBySlugDto extends createZodDto(GetGameBySlugSchema) {}
export class GetGamesByIdsDto extends createZodDto(GetGamesByIdsSchema) {}
export class GetGamesDto extends createZodDto(GetGamesRequestSchema) {}
export class AddGameDto extends createZodDto(AddGameRequestSchema) {}
export class UpdateGameDto extends createZodDto(UpdateGameRequestSchema) {}

export class GameResponseDto extends createZodDto(GameSchema) {}
export class GetGameResponseDto extends createZodDto(GameSchema) {}
export class GetGamesResponseDto extends createZodDto(GameSchema.array()) {}
