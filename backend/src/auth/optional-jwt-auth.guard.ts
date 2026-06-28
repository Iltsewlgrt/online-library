import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    override canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    override handleRequest<TUser = any>(_err: any, user: any): TUser {
        return (user ?? null) as TUser;
    }
}
