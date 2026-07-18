import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { HltbService } from "../services/hltb.service";

@ApiTags("HLTB")
@Controller("hltb")
export class HltbController {
  constructor(private readonly hltb: HltbService) {}

  @Post("/backfill")
  @ApiOperation({ summary: "Backfill HLTB completion times for games" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  @ApiQuery({
    name: "onlyMissing",
    required: false,
    default: false,
    type: Boolean,
  })
  @ApiQuery({ name: "staleDays", required: false })
  async backfillHltb(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("onlyMissing") onlyMissingQuery?: string,
    @Query("staleDays") staleDaysQuery?: string
  ) {
    this.hltb.syncAllGames({
      limit: parsePositiveInt(limitQuery),
      delayMs: parsePositiveInt(delayMsQuery),
      onlyMissing: onlyMissingQuery === "true",
      staleDays: parsePositiveInt(staleDaysQuery),
    });

    return { message: "HLTB backfill started" };
  }

  @Delete("/remove-all")
  @ApiOperation({ summary: "Remove stored HLTB times from all games" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async clearHltb() {
    return this.hltb.clearAllHltb();
  }
}

const parsePositiveInt = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};
