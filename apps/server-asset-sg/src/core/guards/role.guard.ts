import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequireRole } from '@/core/decorators/require-role.decorator';
import { getRoleIndex } from '@/features/users/user.model';
import { JwtRequest } from '@/models/jwt-request';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const role = this.reflector.get(RequireRole, context.getHandler());
        if (role == null) {
            return true;
        }
        const request = context.switchToHttp().getRequest() as JwtRequest;
        return getRoleIndex(request.user.role) >= getRoleIndex(role);
    }
}
