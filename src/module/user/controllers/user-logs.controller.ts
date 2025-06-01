import { ApiTags } from "@nestjs/swagger";
import { UserLogsService } from "../services/user-logs.service";
import { Controller } from "@nestjs/common";

@ApiTags("User Logs")
@Controller("user")
export class UserLogsController {
  constructor(private readonly userLogsService: UserLogsService) {}
}
