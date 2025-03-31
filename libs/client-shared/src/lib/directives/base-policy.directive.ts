import {
  ChangeDetectorRef,
  Directive,
  inject,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { User, Policy } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { map, Subscription } from 'rxjs';
import { Class } from 'type-fest';
import { AppState } from '../state/app-shared-state';
import { selectRDUserProfile } from '../state/app-shared-state.selectors';

@Directive({
  standalone: true,
})
export abstract class BasePolicyDirective<T> implements OnInit, OnChanges, OnDestroy {
  abstract get policy(): Class<Policy<T>>;

  private readonly store = inject(Store<AppState>);

  private user: User | null = null;

  private readonly ref = inject(ChangeDetectorRef);

  private hasRendered = false;

  private readonly subscription = new Subscription();

  constructor(private readonly templateRef: TemplateRef<unknown>, private readonly viewContainer: ViewContainerRef) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectRDUserProfile)
        .pipe(map((user) => (RD.isSuccess(user) ? user.value : null)))
        .subscribe((user) => {
          this.user = user;
          this.render();
        })
    );
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.render();
    this.ref.markForCheck();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private render(): void {
    const policyInstance = this.user == null ? null : new this.policy(this.user);
    const shouldRender = policyInstance != null && this.check(policyInstance);
    if (shouldRender === this.hasRendered) {
      return;
    }
    if (shouldRender) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
    this.hasRendered = shouldRender;
  }

  protected abstract check(policy: Policy<T>): boolean;
}
