import { Directive, Input } from '@angular/core';
import { Policy } from '@shared/policies/base/policy';
import { Class } from 'type-fest';
import { BasePolicyDirective } from './base-policy.directive';

@Directive({
  selector: '[canUpdate]',
  standalone: true,
})
export class CanUpdateDirective<T> extends BasePolicyDirective<T> {
  @Input({ alias: 'canUpdate', required: true })
  policy!: Class<Policy<T>>;

  @Input({ alias: 'canUpdateWith', required: true })
  with!: T;

  protected override check(policy: Policy<T>): boolean {
    return policy.canUpdate(this.with);
  }
}
