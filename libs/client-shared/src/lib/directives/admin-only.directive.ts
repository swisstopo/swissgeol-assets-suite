import { Directive, inject, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { map, Subscription } from 'rxjs';
import { AppState, fromAppShared } from '../state';

@Directive({
  selector: '[adminOnly]',
  standalone: true,
})
export class AdminOnlyDirective implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);

  private readonly subscription = new Subscription();

  constructor(private readonly templateRef: TemplateRef<unknown>, private readonly viewContainer: ViewContainerRef) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(fromAppShared.selectRDUserProfile)
        .pipe(map((user) => (RD.isSuccess(user) ? user.value : null)))
        .subscribe((user) => {
          if (user != null && user.isAdmin) {
            this.viewContainer.createEmbeddedView(this.templateRef);
          } else {
            this.viewContainer.clear();
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
