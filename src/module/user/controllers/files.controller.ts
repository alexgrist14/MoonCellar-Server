import {
  Controller,
  Delete,
  Get,
  Post,
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
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileService } from "../services/file-upload.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { RolesGuard } from "src/module/roles/roles.guard";
import { Roles } from "src/module/roles/roles.decorator";

@ApiTags("Files Controller")
@Controller("file")
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Get("/")
  @ApiResponse({ status: 200, description: "Success" })
  async getFile(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.getFile(key, bucketName);
  }

  @Post("/object")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({ status: 201, description: "Cool!" })
  async uploadObject(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string,
    @Query("object") object: string
  ) {
    return this.fileService.uploadObject(object, key, bucketName);
  }

  @Post("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({ status: 201, description: "WhatsUp Niggga" })
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
  async uploadFile(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.fileService.uploadFile(file, key, bucketName);
  }

  @Delete("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFile(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.deleteFile(key, bucketName);
  }

  @Delete("/multi")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFiles(
    @Query("keys") keys: string[],
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.deleteFiles(keys, bucketName);
  }

  @Get("/buckets")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async getBuckets() {
    return await this.fileService.getBuckets();
  }

  @Get("/bucket-keys")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async getBucketKeys(@Query("bucketName") bucketName: string) {
    return await this.fileService.getBucketKeys(bucketName);
  }

  @Delete("/clear-bucket")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async clearBucket(@Query("bucketName") bucketName: string) {
    return await this.fileService.clearBucket(bucketName);
  }
}
