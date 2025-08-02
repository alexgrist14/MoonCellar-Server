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
    const userId =
      request.params?.userId || request.body?.userId || request.query?.userId;

    if (!token || !userId || token.id !== userId) {
      throw new UnauthorizedException("Wrong user");
    }

    return true;
  }
}
