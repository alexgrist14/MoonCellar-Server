import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UserIdGuard } from "../auth/user.guard";
import { GamesService } from "./games.service";
import mongoose from "mongoose";
import {
  GetPlaythroughFullResponseDto,
  GetPlaythroughsMinimalResponseDto,
  GetPlaythroughsRequestDto,
  GetPlaythroughsResponseDto,
  SavePlaythroughRequestDto,
  UpdatePlaythroughsRequestDto,
} from "src/shared/zod/dto/playthroughs.dto";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get("/playthroughs")
  @ApiOperation({ summary: "Get playthroughs" })
  @ApiCreatedResponse({ type: GetPlaythroughsResponseDto })
  async getPlaythroughsController(@Query() dto: GetPlaythroughsRequestDto) {
    return this.service.getPlaythroughs(dto);
  }

  @Get("/playthroughs/minimal")
  @ApiOperation({ summary: "Get playthroughs (minimal)" })
  @ApiCreatedResponse({ type: GetPlaythroughsMinimalResponseDto })
  async getPlaythroughsMinimalController(
    @Query() dto: GetPlaythroughsRequestDto
  ) {
    return this.service.getPlaythroughsMinimal(dto);
  }

  @Post("/save-playthrough")
  @ApiOperation({ summary: "Save playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async savePlaythroughController(@Body() dto: SavePlaythroughRequestDto) {
    return this.service.savePlaythrough(dto);
  }

  @Put("/update-playthrough/:userId/:id")
  @ApiOperation({ summary: "Update playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async updatePlaythroughController(
    @Param("id") id: string,
    @Body() dto: UpdatePlaythroughsRequestDto
  ) {
    return this.service.updatePlaythrough(new mongoose.Types.ObjectId(id), dto);
  }

  @Delete("/delete-playthrough/:userId/:id")
  @ApiOperation({ summary: "Delete playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async deletePlaythroughController(@Param("id") id: string) {
    return this.service.deletePlaythrough(new mongoose.Types.ObjectId(id));
  }
}
