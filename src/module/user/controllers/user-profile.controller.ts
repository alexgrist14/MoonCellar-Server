import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
  ApiBearerAuth,
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
import { FileUploadService } from "../services/file-upload.service";
import { UserProfileService } from "../services/user-profile.service";
import { BackgroundDto } from "../dto/background.dto";

@ApiTags("User Profile")
@Controller("user")
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly fileUploadService: FileUploadService
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

  @Get("/logs/:userId")
  @ApiOperation({ summary: "Get user logs" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getUserLogs(@Param("userId") userId: string) {
    return this.userProfileService.getUserLogs(userId);
  }

  @Patch("email/:userId")
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiBearerAuth()
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

  @Patch("profile-picture/:userId")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Add user profile picture" })
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
  async uploadProfilePicture(
    @Param("userId") userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    const prevPicture = await this.userProfileService.getProfilePicture(userId);
    console.log(prevPicture);

    if (prevPicture) await this.fileUploadService.deleteFile(prevPicture);

    const fileName = await this.fileUploadService.uploadFile(file, "photos");
    await this.userProfileService.updateProfilePicture(userId, fileName);

    return { profilePicture: fileName };
  }

  @Patch("profile-background/:userId")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Add user profile background" })
  @ApiResponse({ status: 201, description: "background name" })
  async uploadProfileBackground(
    @Param("userId") userId: string,
    @Body() background: BackgroundDto
  ) {
    return await this.userProfileService.updateProfileBackground(
      userId,
      background.url
    );
  }

  @Get("profile-background/:userId")
  @ApiOperation({ summary: "Add user profile background" })
  @ApiResponse({ status: 201, description: "background name" })
  async getProfileBackGround(@Param("userId") userId: string) {
    return await this.userProfileService.getProfileBackground(userId);
  }

  @Get("profile-picture/:userId")
  @ApiOperation({ summary: "Get user profile picture" })
  @ApiResponse({ status: 200, description: "Success" })
  async getProfilePicture(@Param("userId") userId: string) {
    const fileName = await this.userProfileService.getProfilePicture(userId);

    if (!fileName) {
      throw new NotFoundException("Profile picture not found");
    }

    return { fileName };
  }

  @Patch("description/:userId")
  @ApiBearerAuth()
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
}
