import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
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
import { ParseImagesDto } from "../interface/parse.type";

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
    const limit = 1000;
    const count = await this.service.getGamesCount();
    const totalPages = Math.ceil(count / limit);
    let page = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service.igdbToGames(page, limit, totalPages).then((res) => {
          console.log(res);
          !isStop && callback();
        });
      }
    };

    callback();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/parse-images")
  @ApiOperation({ summary: "Parse images" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiBody({ type: ParseImagesDto })
  async parseImages(@Body() dto: ParseImagesDto) {
    const limit = 100;
    const count = await this.service.getGamesCount();
    const totalPages = Math.ceil(count / limit);
    let page = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service.parseImagesToS3(page, limit, dto).then(() => {
          console.log(
            `${page * limit} games parsed (Total: ${totalPages * limit})\n`
          );
          !isStop && setTimeout(() => callback(), 2000);
        });
      }
    };

    callback();
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
