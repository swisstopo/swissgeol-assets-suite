import { User, Policy } from '@asset-sg/shared/v2';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Class } from 'type-fest';

export const authorize = <T, P extends Policy<T>>(policy: Class<P>, currentUser: User): Authorize<P> => {
  const instance = new policy(currentUser);
  const auth = {} as Authorize<P>;
  for (const key of getProperties(instance) as Array<keyof Authorize<P>>) {
    if (typeof key !== 'string' || !key.startsWith('can')) {
      continue;
    }
    const can = instance[key];
    if (typeof can !== 'function') {
      continue;
    }
    const fn = (can as (...args: unknown[]) => boolean).bind(instance);
    auth[key] = ((...args: unknown[]) => check(fn(...args))) as Authorize<P>[keyof Authorize<P>];
  }
  return auth;
};

const getProperties = (value: object): string[] => {
  const props = Object.getOwnPropertyNames(value);
  const parent = Object.getPrototypeOf(value);
  return parent == null || parent === Object.prototype ? props : [...props, ...getProperties(parent)];
};

type Authorize<P> = {
  [K in keyof P]: K extends `can${string}` ? AuthFunction<P[K]> : never;
};

type AuthFunction<F> = F extends (...args: infer A) => boolean ? (...args: A) => void : never;

const check = (condition: boolean): void => {
  if (!condition) {
    throw new HttpException('Not authorized to access this resource', HttpStatus.FORBIDDEN);
  }
};
