import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { UserIdGuard } from "../auth/user.guard";

import { SavePlaythroughDTO } from "./dto/save-playthrough.dto";
import { GamesService } from "./games.service";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Post("/save")
  // @ApiBearerAuth()
  @ApiOperation({ summary: "Save playthrough" })
  // @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async savePlaythroughController(@Body() dto: SavePlaythroughDTO) {
    return this.service.savePlaythrough(dto);
  }
}
