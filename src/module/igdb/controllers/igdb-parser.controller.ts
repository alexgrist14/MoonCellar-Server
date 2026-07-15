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
  async parseGame(
    @Query("igdbId") igdbIdQuery?: string,
    @Query("slug") slug?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string
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
  async backfillGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string
  ) {
    return this.service.backfillGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
      parseImages: parseImagesQuery === "true",
      field,
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
  async syncGamesDirect(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string
  ) {
    return this.service.syncGamesFromIgdb({
      limit: Number(limitQuery) || undefined,
      delayMs: Number(delayMsQuery) || undefined,
      concurrency: Number(concurrencyQuery) || undefined,
      parseImages:
        parseImagesQuery === undefined ? true : parseImagesQuery === "true",
      field,
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
  @ApiQuery({ name: "concurrency", required: false, default: 3 })
  @ApiQuery({
    name: "isForceParse",
    default: false,
    required: false,
    type: Boolean,
  })
  async parseImages(@Query() dto: ParseImagesDto) {
    const { isForceParse, parseType, timeout, concurrency } = dto;
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
            concurrency,
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
