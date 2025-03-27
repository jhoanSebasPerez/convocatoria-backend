import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const validRoutes: string[] = this.reflector.get<string[]>(META_ROLES, context.getHandler());

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user)
            throw new BadRequestException("User not found (request)");

        for (const role of user.roles) {
            if (validRoutes.includes(role)) {
                return true;
            }
        }

        throw new ForbiddenException("You don't have permission to access this route");
    }
}
