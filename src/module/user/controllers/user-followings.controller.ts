import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { UserIdGuard } from "src/module/auth/user.guard";
import { UserFollowingsService } from "../services/user-followings.service";

@ApiTags("User Followings")
@Controller("user")
export class UserFollowingsController {
  constructor(private readonly userFollowingsService: UserFollowingsService) {}

  @Get("/followings/:userId")
  @ApiOperation({ summary: "Get user followings" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getUserFollowings(@Param("userId") userId: string) {
    return this.userFollowingsService.getUserFollowings(userId);
  }

  @Patch("/followings/:userId/:followingId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Add following to user" })
  @ApiResponse({ status: 200, description: "success" })
  async addUserFollowing(
    @Param("userId") userId: string,
    @Param("followingId") followingId: string
  ) {
    return this.userFollowingsService.addUserFollowing(userId, followingId);
  }

  @Delete("/followings/:userId/:followingId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove user following" })
  @ApiResponse({ status: 200, description: "success" })
  async removeUserFollowing(
    @Param("userId") userId: string,
    @Param("followingId") followingId: string
  ) {
    return this.userFollowingsService.removeUserFollowing(userId, followingId);
  }
}
