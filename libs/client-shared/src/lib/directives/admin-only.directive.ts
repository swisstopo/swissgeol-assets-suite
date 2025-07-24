import { ChangeDetectorRef, Directive, inject, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState, fromAppShared } from '../state';

@Directive({
  selector: '[adminOnly]',
  standalone: true,
})
export class AdminOnlyDirective implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);

  private readonly subscription = new Subscription();

  private ref = inject(ChangeDetectorRef);

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(fromAppShared.selectUser).subscribe((user) => {
        if (user != null && user.isAdmin) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
        this.ref.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
