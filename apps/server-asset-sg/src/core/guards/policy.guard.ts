import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UsePolicy } from '../decorators/use-policy.decorator';
import {
  AuthorizationMetadata,
  AuthorizationTarget,
  CreateMetadata,
  DeleteMetadata,
  ShowMetadata,
  UpdateMetadata,
} from '@/core/decorators/authorize.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { AuthorizedRequest, JwtRequest } from '@/models/jwt-request';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly moduleRef: ModuleRef) {}

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
      case 'show':
        return this.authorizeShow(context, auth);
      case 'create':
        return this.authorizeCreate(context, auth);
      case 'update':
        return this.authorizeUpdate(context, auth);
      case 'delete':
        return this.authorizeDelete(context, auth);
      case 'user-only':
        return this.authorizeUserOnly(context);
      case 'admin-only':
        return this.authorizeAdminOnly(context);
    }
  }

  private async authorizeShow(context: ExecutionContext, auth: ShowMetadata): Promise<boolean> {
    const policy = this.extractPolicy(context);
    const record = await this.extractRecord(context, auth.target);
    return policy.canDoEverything() || policy.canShow(record);
  }

  private async authorizeCreate(context: ExecutionContext, _auth: CreateMetadata): Promise<boolean> {
    const policy = this.extractPolicy(context);
    return policy.canDoEverything() || policy.canCreate();
  }

  private async authorizeUpdate(context: ExecutionContext, auth: UpdateMetadata): Promise<boolean> {
    const policy = this.extractPolicy(context);
    const record = await this.extractRecord(context, auth.target);
    return policy.canDoEverything() || policy.canUpdate(record);
  }

  private async authorizeDelete(context: ExecutionContext, auth: DeleteMetadata): Promise<boolean> {
    const policy = this.extractPolicy(context);
    const record = await this.extractRecord(context, auth.target);
    return policy.canDoEverything() || policy.canDelete(record);
  }

  private authorizeUserOnly(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as JwtRequest;
    return request.user != null;
  }

  private authorizeAdminOnly(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as JwtRequest;
    return request.user.isAdmin ?? false;
  }

  private extractPolicy(context: ExecutionContext) {
    const policyClass =
      this.reflector.get(UsePolicy, context.getHandler()) ?? this.reflector.get(UsePolicy, context.getClass());
    if (policyClass == null) {
      throw new Error('missing `UsePolicy` decorator');
    }
    const request = context.switchToHttp().getRequest() as JwtRequest;
    const policy = new policyClass(request.user);
    assignAuthorized(request, { policy });
    return policy;
  }

  private async extractRecord(context: ExecutionContext, target: AuthorizationTarget): Promise<object> {
    const request = context.switchToHttp().getRequest() as JwtRequest;
    const id = target.getId(request);

    const repoType =
      this.reflector.get(UseRepo, context.getHandler()) ?? this.reflector.get(UseRepo, context.getClass());
    if (repoType == null) {
      throw new Error('missing `UseRepo` decorator');
    }
    const repo = this.moduleRef.get(repoType);
    const findBy = target.findBy == null ? repo.find : target.findBy(repo);
    const record = await findBy.call(repo, [id]);
    if (record == null) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    assignAuthorized(request, { record });
    return record;
  }
}

const assignAuthorized = (request: Request, assigns: Partial<AuthorizedRequest['authorized']>) => {
  const authorizedRequest = request as AuthorizedRequest;
  authorizedRequest.authorized ??= {} as AuthorizedRequest['authorized'];
  Object.assign(authorizedRequest.authorized, assigns);
};
