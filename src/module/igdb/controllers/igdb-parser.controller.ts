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

@ApiTags("IGDB")
@Controller("igdb")
export class IgdbParserController {
  constructor(private readonly service: IGDBService) {}

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/platforms/parse")
  @ApiOperation({ summary: "Parse platforms directly from IGDB" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "field", required: false })
  async parsePlatforms(@Query("field") field?: string) {
    return this.service.parsePlatformsFromIgdb({ field });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse")
  @ApiOperation({
    summary:
      "Parse a game directly from IGDB by IGDB id or slug (creates it if not present yet)",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({ name: "igdbId", required: false })
  @ApiQuery({ name: "slug", required: false })
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
  })
  @ApiQuery({ name: "field", required: false })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
  })
  async parseGame(
    @Query("igdbId") igdbIdQuery?: string,
    @Query("slug") slug?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    if (!igdbIdQuery && !slug) {
      throw new BadRequestException("Either igdbId or slug must be provided");
    }

    return this.service.parseGameFromIgdb(
      {
        igdbId: igdbIdQuery ? Number(igdbIdQuery) : undefined,
        slug,
      },
      {
        parseImages:
          parseImagesQuery === undefined ? true : parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
      }
    );
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
  @ApiQuery({
    name: "parseImages",
    default: false,
    required: false,
    type: Boolean,
  })
  @ApiQuery({ name: "field", required: false })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
  })
  async backfillGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    return this.service.backfillGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
      parseImages: parseImagesQuery === "true",
      field,
      forceParse: forceParseQuery === "true",
    });
  }

  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/backfill-hypes")
  @ApiOperation({ summary: "Backfill IGDB hypes for upcoming games" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  async backfillUpcomingHypes(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string
  ) {
    return this.service.backfillUpcomingHypes({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
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
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
  })
  @ApiQuery({ name: "field", required: false })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
  })
  async syncGamesDirect(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    return this.service.syncGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
      parseImages:
        parseImagesQuery === undefined ? true : parseImagesQuery === "true",
      field,
      forceParse: forceParseQuery === "true",
    });
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
