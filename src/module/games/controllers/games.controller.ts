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
import mongoose from "mongoose";
import {
  AddGameDto,
  GameResponseDto,
  GetGamesDto,
  GetGamesResponseDto,
  UpdateGameDto,
} from "src/shared/zod/dto/games.dto";
import { GamesService } from "../services/games.service";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get("/")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGames(@Query() dto: GetGamesDto) {
    console.log(dto);
    return this.games.getGames(dto);
  }

  @Post("/add")
  @ApiOperation({ summary: "Add game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async addGame(@Body() dto: AddGameDto) {
    return this.games.addGame(dto);
  }

  @Put("/update/:id")
  @ApiOperation({ summary: "Update game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async updateGame(@Param("id") id: string, @Body() dto: UpdateGameDto) {
    return this.games.updateGame(new mongoose.Types.ObjectId(id), dto);
  }

  @Delete("/delete/:id")
  @ApiOperation({ summary: "Delete game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async deleteGame(@Param("id") id: string) {
    return this.games.deleteGame(new mongoose.Types.ObjectId(id));
  }

  @Post("/parse-common")
  @ApiOperation({ summary: "Parse filters" })
  async parseCommon() {
    return this.games.parseFieldsToJson();
  }
}
