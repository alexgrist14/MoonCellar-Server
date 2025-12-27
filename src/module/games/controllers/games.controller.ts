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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import mongoose from "mongoose";
import {
  AddGameDto,
  GameResponseDto,
  GetGameByIdDto,
  GetGameBySlugDto,
  GetGameResponseDto,
  GetGamesByIdsDto,
  GetGamesDto,
  GetGamesResponseDto,
  UpdateGameDto,
} from "src/shared/zod/dto/games.dto";
import { GamesService } from "../services/games.service";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get("/by-id/:id")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGameResponseDto })
  async getGameById(@Query() dto: GetGameByIdDto) {
    return this.games.getGameById(dto);
  }

  @Get("/by-ids")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGameByIds(@Query() dto: GetGamesByIdsDto) {
    return this.games.getGamesByIds(dto);
  }

  @Get("/by-slug/:slug")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGameResponseDto })
  async getGameBySlug(@Query() dto: GetGameBySlugDto) {
    return this.games.getGameBySlug(dto);
  }

  @Post("/")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGames(@Body() dto: GetGamesDto) {
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

  @Post("/upload-image/:id")
  @ApiOperation({ summary: "Upload image" })
  @ApiCreatedResponse({ type: String })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiQuery({
    name: "type",
    type: String,
    enum: ["cover", "screenshot", "artwork"],
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async uploadImage(
    @Query("gameId") gameId: string,
    @Query("type") type: "cover" | "screenshot" | "artwork",
    @UploadedFile() image: Express.Multer.File
  ) {
    return this.games.uploadImage(
      new mongoose.Types.ObjectId(gameId),
      image,
      type
    );
  }
}
