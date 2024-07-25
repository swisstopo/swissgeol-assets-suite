import { Directive, Input } from '@angular/core';
import { Policy } from '@asset-sg/shared/v2';
import { Class } from 'type-fest';
import { BasePolicyDirective } from './base-policy.directive';

@Directive({
  selector: '[canCreate]',
  standalone: true,
})
export class CanCreateDirective<T> extends BasePolicyDirective<T> {
  @Input({ alias: 'canCreate', required: true })
  policy!: Class<Policy<T>>;

  protected override check(policy: Policy<T>): boolean {
    return policy.canCreate();
  }
}
