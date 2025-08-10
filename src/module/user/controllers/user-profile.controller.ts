import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UpdateEmailDto } from "../../auth/dto/update-email.dto";
import { UpdatePasswordDto } from "../../auth/dto/update-password.dto";
import { UserIdGuard } from "../../auth/user.guard";
import { UpdateDescriptionDto } from "../dto/update-description.dto";
import { User } from "../schemas/user.schema";
import { FileService } from "../services/file-upload.service";
import { UserProfileService } from "../services/user-profile.service";
import { RolesGuard } from "src/module/roles/roles.guard";

@ApiTags("User Profile")
@Controller("user")
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly fileService: FileService
  ) {}

  @Get("name")
  @ApiOperation({ summary: "Get user by name" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  @ApiQuery({ name: "name" })
  findByName(@Query("name") query: string): Promise<User> {
    return this.userProfileService.findByString(query, "userName");
  }

  @Get("email")
  @ApiOperation({ summary: "Get user by email" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  @ApiQuery({ name: "email" })
  findByEmail(@Query("email") query: string): Promise<User> {
    return this.userProfileService.findByString(query, "email");
  }

  @Get(":userId")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async findById(@Param("userId") userId: string): Promise<User> {
    return this.userProfileService.findById(userId);
  }

  @Patch("email/:userId")
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update user email" })
  @ApiResponse({ status: 200, description: "success" })
  async updateEmail(
    @Param("userId") userId: string,
    @Body() updateEmailDto: UpdateEmailDto
  ): Promise<User> {
    return this.userProfileService.updateEmail(userId, updateEmailDto);
  }

  @Patch("password/:userId")
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update user password" })
  @ApiResponse({ status: 200, description: "Success" })
  async updatePassword(
    @Param("userId") userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req
  ): Promise<User> {
    if (req.user._id.toString() !== userId) {
      throw new UnauthorizedException("You can only update your own password");
    }
    return this.userProfileService.updatePassword(userId, updatePasswordDto);
  }

  @Patch("avatar")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Add user avatar" })
  @ApiResponse({ status: 201, description: "picture name" })
  @ApiConsumes("multipart/form-data")
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
  async uploadAvatar(
    @Query("userId") userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!userId) return;

    return this.userProfileService.updateAvatar(userId, file);
  }

  @Patch("background")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Add user background" })
  @ApiResponse({ status: 201, description: "picture name" })
  @ApiConsumes("multipart/form-data")
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
  async uploadBackground(
    @Query("userId") userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!userId) return;

    return this.userProfileService.updateBackground(userId, file);
  }

  @Patch("description/:userId")
  @UseGuards(RolesGuard)
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update user description" })
  @ApiResponse({ status: 200, description: "Success" })
  async updateDescription(
    @Param("userId") userId: string,
    @Body() descriptionDto: UpdateDescriptionDto
  ) {
    return await this.userProfileService.updateUserDescription(
      userId,
      descriptionDto.description
    );
  }

  @Patch("profile-time/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update user updateAt field" })
  @ApiResponse({ status: 201, description: "date" })
  async updateUserTime(@Param("userId") userId: string) {
    return await this.userProfileService.updateUserTime(userId);
  }
}
