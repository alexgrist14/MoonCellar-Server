import { Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { IGDBService } from "../igdb.service";
import { ParserType } from "../interface/common.interface";
import { parserTypes } from "../constants/common";
import { AuthGuard } from "@nestjs/passport";
import { UserIdGuard } from "src/module/auth/user.guard";
import { Roles } from "src/module/roles/roles.decorator";
import { Role } from "src/module/roles/enums/role.enum";
import { RolesGuard } from "src/module/roles/roles.guard";

@ApiTags("IGDB Parser")
@Controller("igdb-parser")
export class IgdbParserController {
  constructor(private readonly service: IGDBService) {}

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  // @UseGuards(RolesGuard)
  // @Roles(Role.Admin)
  @Get("/token")
  @ApiOperation({ summary: "Get IGDB token" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  getToken() {
    return this.service.getToken();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/")
  @ApiOperation({ summary: "Parse all IGDB databases" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  all() {
    return this.service.parseAll();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/:type")
  @ApiOperation({ summary: "Parse Selected IGDB database" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "type", enum: parserTypes })
  selected(@Query("type") type: ParserType) {
    return this.service.parseSelected(type);
  }
}
