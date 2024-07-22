import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '@shared/models/user';
import { Policy } from '@shared/policies/base/policy';
import { Class } from 'type-fest';

export const authorize = <T>(policy: Class<Policy<T>>, currentUser: User): Authorize<T> => {
  return new Authorize<T>(new policy(currentUser));
};

class Authorize<T> {
  constructor(private readonly policy: Policy<T>) {}

  canShow(value: T): void {
    check(this.policy.canDoEverything() || this.policy.canShow(value));
  }

  canCreate(): void {
    check(this.policy.canDoEverything() || this.policy.canCreate());
  }

  canUpdate(value: T): void {
    check(this.policy.canDoEverything() || this.policy.canUpdate(value));
  }

  canDelete(value: T): void {
    check(this.policy.canDoEverything() || this.policy.canDelete(value));
  }
}

const check = (condition: boolean): void => {
  if (!condition) {
    throw new HttpException('Not authorized to access this resource', HttpStatus.FORBIDDEN);
  }
};
