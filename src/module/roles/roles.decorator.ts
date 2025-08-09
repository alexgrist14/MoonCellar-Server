import { SetMetadata } from "@nestjs/common";
import { IRole } from "src/shared/zod/schemas/role.schema";

export const ROLES_KEY = "roles";
export const Roles = (...roles: IRole[]) => SetMetadata(ROLES_KEY, roles);
