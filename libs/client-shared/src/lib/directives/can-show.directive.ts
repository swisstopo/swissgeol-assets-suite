import { Directive, Input } from '@angular/core';
import { Policy } from '@shared/policies/base/policy';
import { Class } from 'type-fest';
import { BasePolicyDirective } from './base-policy.directive';

@Directive({
  selector: '[canShow]',
  standalone: true,
})
export class CanShowDirective<T> extends BasePolicyDirective<T> {
  @Input({ alias: 'canShow', required: true })
  policy!: Class<Policy<T>>;

  @Input({ alias: 'canShowWith', required: true })
  with!: T;

  protected override check(policy: Policy<T>): boolean {
    return policy.canShow(this.with);
  }
}
