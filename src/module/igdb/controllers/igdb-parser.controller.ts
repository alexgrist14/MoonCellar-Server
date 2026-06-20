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
import { ParseImagesDto } from "src/shared/zod/dto/igdb.dto";

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
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "concurrency", required: false })
  @ApiQuery({ name: "updatedAfter", required: false })
  async parseGames(
    @Query("limit") limitQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("updatedAfter") updatedAfterQuery?: string
  ) {
    const limit = Number(limitQuery) || 100;
    const concurrency = Number(concurrencyQuery) || undefined;
    const updatedAfter = Number(updatedAfterQuery) || undefined;
    const count = await this.service.getGamesCount({ updatedAfter });
    const totalPages = Math.ceil(count / limit);
    let page = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service
          .igdbToGames(page, limit, totalPages, {
            concurrency,
            updatedAfter,
          })
          .then((res) => {
            console.log(res);
            !isStop && callback();
          });
      }
    };

    callback();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/backfill")
  @ApiOperation({ summary: "Backfill IGDB games with checkpoint tracking" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  async backfillGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string
  ) {
    return this.service.backfillGames({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
    });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/sync-updated")
  @ApiOperation({ summary: "Sync only updated IGDB games" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  @ApiQuery({ name: "syncToGames", required: false })
  @ApiQuery({ name: "concurrency", required: false })
  async syncUpdatedGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("syncToGames") syncToGamesQuery?: string,
    @Query("concurrency") concurrencyQuery?: string
  ) {
    const result = await this.service.syncUpdatedGames({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
    });

    if (syncToGamesQuery !== "true" || !result?.changedIds?.length) {
      return result;
    }

    const gamesSync = await this.service.igdbToGames(
      1,
      result.changedIds.length,
      1,
      {
        igdbGameIds: result.changedIds,
        concurrency: Number(concurrencyQuery) || undefined,
      }
    );

    return {
      ...result,
      gamesSync,
    };
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/parse-images")
  @ApiOperation({ summary: "Parse images" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "parseType", enum: ["covers", "artworks", "screenshots"] })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "timeout", required: false })
  @ApiQuery({ name: "isParseExisted", default: false, required: false })
  async parseImages(@Query() dto: ParseImagesDto) {
    const { isParseExisted, limit, parseType, timeout } = dto;
    const count = await this.service.getGamesCount();
    const totalPages = Math.ceil(count / limit);
    let page = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service
          .parseImagesToS3(page, limit || 50, {
            parseType,
            isParseExisted,
          })
          .then(() => {
            console.log(
              `${page * limit} games parsed (Total: ${totalPages * limit})\n`
            );
            !isStop && setTimeout(() => callback(), timeout || 2000);
          })
          .catch(() => {});
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
