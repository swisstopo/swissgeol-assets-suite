import { Role, User, WorkgroupId } from '@asset-sg/shared/v2';
import { CanActivate, ExecutionContext, HttpException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import * as jose from 'jose';
import { v5 as uuidv5 } from 'uuid';

import { IS_PUBLIC_KEY } from '@/core/decorators/public.decorator';
import { UserRepo } from '@/features/users/user.repo';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);
  private readonly jwks: ReturnType<typeof jose.createRemoteJWKSet>;

  constructor(
    private readonly reflector: Reflector,
    private readonly userRepo: UserRepo,
    private readonly workgroupRepo: WorkgroupRepo,
  ) {
    const jwksUri = process.env.OAUTH_JWKS_URI ?? `${process.env.OAUTH_ISSUER}/.well-known/jwks.json`;
    this.jwks = jose.createRemoteJWKSet(new URL(jwksUri));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as Request;

    try {
      if (process.env.ANONYMOUS_MODE === 'true') {
        await this.handleAnonymousMode(request);
        return true;
      }

      if (process.env.NODE_ENV === 'development') {
        const authentication = request.header('Authorization');
        if (authentication?.startsWith('Impersonate ')) {
          const email = authentication.split(' ', 2)[1];
          const user = await this.userRepo.findByEmail(email);
          if (user == null) {
            throw new HttpException({ error: `no user with email '${email}' found` }, 401);
          }
          Object.assign(request, { user });
          return true;
        }
      }

      await this.handleTokenAuth(request);
      return true;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      this.logger.warn(`Authentication failed: ${e instanceof Error ? e.message : e}`);
      throw new HttpException({ error: 'not authorized by eIAM' }, 403);
    }
  }

  private async handleTokenAuth(request: Request): Promise<void> {
    const token = this.extractBearerToken(request);
    const { payload } = await jose.jwtVerify(token, this.jwks, { algorithms: ['RS256'] });

    this.checkAuthorizedGroups(payload);

    const oidcId = payload.sub;
    if (oidcId == null || oidcId.length === 0) {
      throw new HttpException({ error: 'invalid JWT payload: missing sub' }, 401);
    }

    let user = (await this.userRepo.find(oidcId)) ?? (await this.initializeDefaultUser(token));
    if (user.firstName === '' || user.lastName === '') {
      user = (await this.updateExistingUser(token, user)) ?? user;
    }

    Object.assign(request, { user });
  }

  private extractBearerToken(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new Error('No bearer token found');
    }
    return token;
  }

  private checkAuthorizedGroups(payload: jose.JWTPayload): void {
    const authorizedGroups = process.env.OAUTH_AUTHORIZED_GROUPS?.split(',').map((group) => group.trim().toLowerCase());
    if (!authorizedGroups) {
      throw new Error('OAUTH_AUTHORIZED_GROUPS not configured');
    }
    const userGroups = ((payload as Record<string, unknown>)['cognito:groups'] as string[] | undefined) ?? [];
    const normalizedUserGroups = userGroups.map((group) => group.trim().toLowerCase());
    const isAuthorized = normalizedUserGroups.some((group) => authorizedGroups.includes(group));
    if (!isAuthorized) {
      throw new Error('User not in authorized groups');
    }
  }

  private async handleAnonymousMode(request: Request): Promise<void> {
    const swisstopoAssetsNamespace = '29248768-a9ac-4ef8-9dcb-d9847753208b';
    const id = uuidv5('anonymous', swisstopoAssetsNamespace);
    const workgroups = await this.workgroupRepo.list();
    const roles = new Map<WorkgroupId, Role>(workgroups.map((workgroup) => [workgroup.id, Role.Reader]));
    const user: User = {
      id,
      email: '',
      lastName: '',
      firstName: '',
      lang: 'de',
      isAdmin: false,
      roles,
    };
    Object.assign(request, { user });
  }

  private async getUserInfo(token: string): Promise<UserInfo> {
    const response = await fetch(`${process.env.OAUTH_USER_INFO_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
    };
  }

  private async initializeDefaultUser(accessToken: string): Promise<User> {
    const data = await this.getUserInfo(accessToken);
    try {
      return await this.userRepo.create({
        oidcId: data.id,
        email: data.email,
        lang: 'de',
        isAdmin: false,
        roles: new Map(),
        firstName: data.firstName,
        lastName: data.lastName,
      });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
        throw e;
      }
      const user = await this.userRepo.find(data.id);
      if (user == null) {
        throw e;
      }
      return user;
    }
  }

  private async updateExistingUser(accessToken: string, user: User): Promise<User | null> {
    const data = await this.getUserInfo(accessToken);
    user.firstName = data.firstName;
    user.lastName = data.lastName;
    return await this.userRepo.update(user.id, user);
  }
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
