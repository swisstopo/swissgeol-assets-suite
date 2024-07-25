import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationMetadata } from '@/core/decorators/authorize.decorator';
import { JwtRequest } from '@/models/jwt-request';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const auth = this.reflector.get<AuthorizationMetadata>('authorization', context.getHandler());
    if (auth == null) {
      return true;
    }
    const request = context.switchToHttp().getRequest() as JwtRequest;
    if (request.user == null) {
      return false;
    }
    switch (auth.action) {
      case 'user-only':
        return this.authorizeUserOnly(context);
      case 'admin-only':
        return this.authorizeAdminOnly(context);
    }
  }

  private authorizeUserOnly(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as JwtRequest;
    return request.user != null;
  }

  private authorizeAdminOnly(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as JwtRequest;
    return request.user.isAdmin ?? false;
  }
}
