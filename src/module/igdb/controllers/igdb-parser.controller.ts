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

@ApiTags("IGDB")
@Controller("igdb")
export class IgdbParserController {
  constructor(private readonly service: IGDBService) {}

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/to-platforms")
  @ApiOperation({ summary: "Parse platforms" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  async parsePlatforms() {
    return this.service.igdbToPlatforms();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/to-games")
  @ApiOperation({ summary: "Parse games" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  async parseGames() {
    const limit = 500;
    const count = await this.service.getGamesCount();
    const totalPages = Math.ceil(count / limit);

    for (let page = 1; page <= totalPages; page++) {
      console.log(
        `Processing page ${page} of ${totalPages} (${limit * page} items)`
      );
      await this.service.igdbToGames(page, limit);
    }
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
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
