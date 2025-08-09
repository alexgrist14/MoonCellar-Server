import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { IRole } from "src/shared/zod/schemas/role.schema";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Admin user management")
@Controller("admin")
@UseGuards(RolesGuard)
@Roles("admin")
@UseGuards(AuthGuard("jwt"))
@ApiCookieAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  async getAll() {
    return this.adminService.getAllUsers();
  }

  @Get("users/:userId")
  async getUserById(@Param("userId") userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Patch("users/:userId/role/:role")
  async addUserRole(
    @Param("userId") userId: string,
    @Param("role") role: IRole
  ) {
    return this.adminService.addUserRole(userId, role);
  }
}
