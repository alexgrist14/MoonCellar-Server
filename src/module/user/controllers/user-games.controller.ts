import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UserGamesService } from "../services/user-games.service";
import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserIdGuard } from "src/module/auth/user.guard";
import { AddGameRatingDto } from "../dto/add-game-rating.dto";

@ApiTags("User Games")
@Controller("user")
export class UserGamesController {
  constructor(private readonly userGamesService: UserGamesService) {}

  @Delete("rating/:userId/:gameId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove user rating from game" })
  @ApiResponse({ status: 200, description: "Rating removed successfully" })
  async removeGameRating(
    @Param("userId") userId: string,
    @Param("gameId") gameId: number
  ) {
    return this.userGamesService.removeGameRating(userId, gameId);
  }

  @Patch("rating/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Add user rating to game" })
  @ApiResponse({ status: 200, description: "Rating added successfully" })
  async addGameRating(
    @Param("userId") userId: string,
    @Body() gameRatingDto: AddGameRatingDto
  ) {
    return this.userGamesService.addGameRating(
      userId,
      gameRatingDto.game,
      gameRatingDto.rating
    );
  }
}
