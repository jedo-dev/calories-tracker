import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const method = request.method;

    if (
      path === '/health' ||
      path === '/admin' || // static admin page shell; its API calls are guarded
      path === '/admin/' ||
      path.startsWith('/auth/telegram') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/login') ||
      (path.startsWith('/products') && method === 'GET')
    ) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

