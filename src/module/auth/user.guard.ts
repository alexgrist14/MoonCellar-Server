import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    console.log(context);
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = request.params.userId;

    if (!user || user._id.toString() !== userId) {
      throw new UnauthorizedException("You can only change your own account");
    }

    return true;
  }
}
