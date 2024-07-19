import { FindRepo, ReadRepo } from '@/core/repo';
import { HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { SingleKeyObject } from 'type-fest';

type ParamType = typeof Number | typeof String;

export interface AuthorizationTarget {
  getId: (request: Request) => string | number;
  findBy?: (repo: FindRepo<unknown, unknown>) => (id: never) => Promise<object | null>;
}

type TargetIdMapping<M> = SingleKeyObject<M> | ((req: Request) => string | number);

export interface ShowMetadata {
  action: 'show';
  target: AuthorizationTarget;
}

export interface CreateMetadata {
  action: 'create';
}

export interface UpdateMetadata {
  action: 'update';
  target: AuthorizationTarget;
}

export interface DeleteMetadata {
  action: 'delete';
  target: AuthorizationTarget;
}

export interface UserOnlyMetadata {
  action: 'user-only';
}

export interface AdminOnlyMetadata {
  action: 'admin-only';
}

export type AuthorizationMetadata =
  | ShowMetadata
  | CreateMetadata
  | UpdateMetadata
  | DeleteMetadata
  | UserOnlyMetadata
  | AdminOnlyMetadata;

export const Authorize = {
  Show: <M extends Record<string, ParamType>, R extends ReadRepo<unknown, unknown>>(
    mapping: TargetIdMapping<M>,
    findBy?: (repo: R) => (id: never) => Promise<object | null>
  ) => {
    return SetMetadata('authorization', {
      action: 'show',
      target: {
        getId: makeIdFetch(mapping),
        findBy,
      },
    } as ShowMetadata);
  },

  Create: () =>
    SetMetadata('authorization', {
      action: 'create',
    } as CreateMetadata),

  Update: <M extends Record<string, ParamType>, R extends ReadRepo<unknown, unknown>>(
    mapping: TargetIdMapping<M>,
    findBy?: (repo: R) => (id: never) => Promise<object | null>
  ) => {
    return SetMetadata('authorization', {
      action: 'update',
      target: {
        getId: makeIdFetch(mapping),
        findBy,
      },
    } as UpdateMetadata);
  },

  Delete: <M extends Record<string, ParamType>, R extends ReadRepo<unknown, unknown>>(
    mapping: TargetIdMapping<M>,
    findBy?: (repo: R) => (id: never) => Promise<object | null>
  ) => {
    return SetMetadata('authorization', {
      action: 'delete',
      target: {
        getId: makeIdFetch(mapping),
        findBy,
      },
    } as DeleteMetadata);
  },

  User: () => SetMetadata('authorization', { action: 'user-only' } as UserOnlyMetadata),
  Admin: () => SetMetadata('authorization', { action: 'admin-only' } as AdminOnlyMetadata),
};

const makeIdFetch = <M extends Record<string, ParamType>>(mapping: TargetIdMapping<M>) => {
  if (mapping instanceof Function) {
    return mapping;
  }
  const [name, type] = Object.entries(mapping)[0];
  return loadIdByParam(name, type);
};

const loadIdByParam =
  (name: string, type: ParamType) =>
  (request: Request): string | number => {
    let paramValue: string | number = request.params[name];
    if (paramValue == null) {
      throw new HttpException(`Missing ${name} parameter`, HttpStatus.BAD_REQUEST);
    }
    if (type === String) {
      return paramValue;
    }
    paramValue = parseInt(paramValue);
    if (isNaN(paramValue)) {
      throw new HttpException(`Parameter ${name} must be a number`, HttpStatus.BAD_REQUEST);
    }
    return paramValue;
  };
