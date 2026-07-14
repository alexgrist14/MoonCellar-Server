import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { IGDBService } from "../igdb.service";
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
    return this.service.parsePlatformsFromIgdb();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse")
  @ApiOperation({
    summary: "Parse a single game directly from IGDB by slug or id",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({ name: "slug", required: false })
  @ApiQuery({ name: "id", required: false })
  async parseGame(@Query("slug") slug?: string, @Query("id") id?: string) {
    if (!slug && !id) {
      throw new BadRequestException("Either slug or id must be provided");
    }

    return this.service.parseGameFromIgdb({ slug, id });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse-all")
  @ApiOperation({
    summary: "Parse all games directly from IGDB, one by one",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false, default: 100 })
  @ApiQuery({ name: "concurrency", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  async parseAllGames(
    @Query("limit") limitQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("delayMs") delayMsQuery?: string
  ) {
    const limit = Number(limitQuery) || 100;
    const concurrency = Number(concurrencyQuery) || undefined;
    const delayMs = Number(delayMsQuery) || undefined;
    const count = await this.service.getLinkedGamesCount();
    const totalPages = Math.ceil(count / limit);
    let page = 0;
    let parsedCount = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service
          .parseAllGamesFromIgdb(page, limit, {
            concurrency,
            delayMs,
          })
          .then((res) => {
            parsedCount += res.filter(Boolean).length;
            console.log(`Parsed ${parsedCount}/${count} games from IGDB`);
            !isStop && callback();
          });
      }
    };

    callback();
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/backfill")
  @ApiOperation({
    summary: "Backfill the full IGDB games catalog directly into games",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  @ApiQuery({ name: "concurrency", required: false })
  async backfillGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string
  ) {
    return this.service.backfillGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
    });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/sync-direct")
  @ApiOperation({
    summary:
      "Sync changed IGDB games directly into games, bypassing the local IGDB mirror",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  @ApiQuery({ name: "concurrency", required: false })
  async syncGamesDirect(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string
  ) {
    return this.service.syncGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
    });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/parse-images")
  @ApiOperation({ summary: "Parse images" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "parseType", enum: ["covers", "artworks", "screenshots"] })
  @ApiQuery({ name: "limit", required: false, default: 50 })
  @ApiQuery({ name: "timeout", required: false, default: 2000 })
  @ApiQuery({
    name: "isForceParse",
    default: false,
    required: false,
    type: Boolean,
  })
  async parseImages(@Query() dto: ParseImagesDto) {
    const { isForceParse, parseType, timeout } = dto;
    const limit = dto.limit || 50;
    const count = await this.service.getImagesToParseCount({
      parseType,
      isForceParse,
    });
    const totalPages = Math.ceil(count / limit);
    let page = 0;

    const callback = (isStop?: boolean) => {
      page += 1;
      if (page <= totalPages) {
        this.service
          .parseImagesToS3(page, limit, {
            parseType,
            isForceParse,
          })
          .then(() => {
            console.log(
              `${Math.min(page * limit, count)}/${count} games parsed\n`
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
  @Post("/parse-images/game")
  @ApiOperation({ summary: "Parse images for a single game by slug or id" })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({ name: "slug", required: false })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "parseType", enum: ["covers", "artworks", "screenshots"] })
  @ApiQuery({
    name: "isForceParse",
    default: true,
    required: false,
    type: Boolean,
  })
  async parseImagesForGame(
    @Query("slug") slug?: string,
    @Query("id") id?: string,
    @Query("parseType") parseType?: "covers" | "screenshots" | "artworks",
    @Query("isForceParse") isForceParseQuery?: string
  ) {
    if (!slug && !id) {
      throw new BadRequestException("Either slug or id must be provided");
    }

    return this.service.parseImagesForGame(
      { slug, id },
      {
        parseType,
        isForceParse:
          isForceParseQuery === undefined ? true : isForceParseQuery === "true",
      }
    );
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Get("/token")
  @ApiOperation({ summary: "Get IGDB token" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  getToken() {
    return this.service.getToken();
  }
}
