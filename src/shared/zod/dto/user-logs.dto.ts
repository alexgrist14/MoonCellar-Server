import { createZodDto } from "@anatine/zod-nestjs";
import { GetUserLogsSchema } from "../schemas/user-logs.schema";

export class GetUserLogsDto extends createZodDto(GetUserLogsSchema) {}
