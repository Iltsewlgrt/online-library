import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws for unauthenticated requests.
 * When the token is absent or invalid `req.user` is set to null.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    override canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    override handleRequest<TUser = any>(_err: any, user: any): TUser {
        // Return the user if valid, or null for guests — never throw.
        return (user ?? null) as TUser;
    }
}
