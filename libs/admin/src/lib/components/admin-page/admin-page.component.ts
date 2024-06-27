import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { AppPortalService, LifecycleHooks, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { asyncScheduler, observeOn } from 'rxjs';

@Component({
  selector: 'asset-sg-admin',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [LifecycleHooksDirective],
})
export class AdminPageComponent {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _cd = inject(ChangeDetectorRef);

  constructor() {
    this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this._appPortalService.setAppBarPortalContent(null);
      this._appPortalService.setDrawerPortalContent(
        new TemplatePortal(this.templateDrawerPortalContent, this._viewContainerRef)
      );
      this._cd.detectChanges();
    });
  }
}
