import { createZodDto } from "@anatine/zod-nestjs";
import {
  GetUserByIdSchema,
  GetUserByStringSchema,
  UpdateDescriptionSchema,
  UpdateUserEmailSchema,
  UpdateUserPasswordSchema,
} from "../schemas/user.schema";

export class GetUserByStringDto extends createZodDto(GetUserByStringSchema) {}
export class GetUserByIdDto extends createZodDto(GetUserByIdSchema) {}
export class UpdateUserEmailDto extends createZodDto(UpdateUserEmailSchema) {}
export class UpdateUserPasswordDto extends createZodDto(
  UpdateUserPasswordSchema
) {}
export class UpdateDescriptionDto extends createZodDto(
  UpdateDescriptionSchema
) {}
