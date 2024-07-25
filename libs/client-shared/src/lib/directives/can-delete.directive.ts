import { Directive, Input } from '@angular/core';
import { Policy } from '@asset-sg/shared/v2';
import { Class } from 'type-fest';
import { BasePolicyDirective } from './base-policy.directive';

@Directive({
  selector: '[canDelete]',
  standalone: true,
})
export class CanDeleteDirective<T> extends BasePolicyDirective<T> {
  @Input({ alias: 'canDelete', required: true })
  policy!: Class<Policy<T>>;

  @Input({ alias: 'canDeleteWith', required: true })
  with!: T;

  protected override check(policy: Policy<T>): boolean {
    return policy.canDelete(this.with);
  }
}
