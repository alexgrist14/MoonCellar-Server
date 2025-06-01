import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { jwtDecode } from "jwt-decode";

@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token: { id: string } = jwtDecode(request.cookies.accessMoonToken);
    const userId = request.params.userId || request.body.userId;

    if (!token || !userId || token.id !== userId) {
      throw new UnauthorizedException("You can only change your own account");
    }

    return true;
  }
}
