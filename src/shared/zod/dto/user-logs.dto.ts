import { createZodDto } from "nestjs-zod";
import { GetUserLogsSchema } from "../schemas/user-logs.schema";

export class GetUserLogsDto extends createZodDto(GetUserLogsSchema) {}
