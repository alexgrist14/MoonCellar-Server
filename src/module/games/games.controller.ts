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
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserIdGuard } from "../auth/user.guard";
import { GamesService } from "./games.service";
import {
  GetPlaythroughsDTO,
  SavePlaythroughDTO,
  UpdatePlaythroughDTO,
} from "./dto/playthrough.dto";
import mongoose from "mongoose";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get("/playthroughs")
  @ApiOperation({ summary: "Get playthroughs" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async getPlaythroughsController(@Query() dto: GetPlaythroughsDTO) {
    return this.service.getPlaythroughs(dto);
  }

  @Post("/save-playthrough")
  @ApiOperation({ summary: "Save playthrough" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async savePlaythroughController(@Body() dto: SavePlaythroughDTO) {
    return this.service.savePlaythrough(dto);
  }

  @Put("/update-playthrough/:userId/:id")
  @ApiOperation({ summary: "Update playthrough" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async updatePlaythroughController(
    @Param("id") id: string,
    @Body() dto: UpdatePlaythroughDTO
  ) {
    return this.service.updatePlaythrough(new mongoose.Types.ObjectId(id), dto);
  }

  @Delete("/delete-playthrough/:userId/:id")
  @ApiOperation({ summary: "Delete playthrough" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async deletePlaythroughController(@Param("id") id: string) {
    return this.service.deletePlaythrough(new mongoose.Types.ObjectId(id));
  }
}
