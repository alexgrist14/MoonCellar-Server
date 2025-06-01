import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { UserIdGuard } from "../auth/user.guard";

import { SavePlaythroughDTO } from "./dto/save-playthrough.dto";
import { GamesService } from "./games.service";
import { Roles } from "../roles/roles.decorator";
import { Role } from "../roles/enums/role.enum";
import { RolesGuard } from "../roles/roles.guard";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Post("/save")
  @ApiOperation({ summary: "Save playthrough" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard, RolesGuard)
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  async savePlaythroughController(@Body() dto: SavePlaythroughDTO) {
    return this.service.savePlaythrough(dto);
  }
}
