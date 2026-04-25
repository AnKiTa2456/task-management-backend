import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector }         from '@nestjs/core';
import { AuthGuard }         from '@nestjs/passport';
import { IS_PUBLIC_KEY }     from '../decorators/public.decorator';

/**
 * Global guard — applied to every route.
 * Routes decorated with @Public() skip JWT verification.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any) {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Access token is missing or invalid');
    }
    return user;
  }
}
