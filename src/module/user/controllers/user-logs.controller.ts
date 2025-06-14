import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserLogsService } from "../services/user-logs.service";
import { Controller, Get, Param, Query } from "@nestjs/common";

@ApiTags("User Logs")
@Controller("user")
export class UserLogsController {
  constructor(private readonly userLogsService: UserLogsService) {}

  @Get("/logs/:userId")
  @ApiOperation({ summary: "Get user logs" })
  @ApiQuery({ name: "take", required: false })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  getLogs(
    @Param("userId") userId: string,
    @Query("take") take: number,
    @Query("page") page: number
  ) {
    return this.userLogsService.getUserLogs(userId, take, page);
  }
}
