import { createZodDto } from "@anatine/zod-nestjs";
import {
  AddGameRequestShema,
  GameSchema,
  GetGamesByIdsSchema,
  GetGamesRequestShema,
  UpdateGameRequestShema,
} from "../schemas/games.schema";

export class GetGamesByIdsDto extends createZodDto(GetGamesByIdsSchema) {}
export class GetGamesDto extends createZodDto(GetGamesRequestShema) {}
export class AddGameDto extends createZodDto(AddGameRequestShema) {}
export class UpdateGameDto extends createZodDto(UpdateGameRequestShema) {}

export class GameResponseDto extends createZodDto(GameSchema) {}
export class GetGamesResponseDto extends createZodDto(GameSchema.array()) {}
