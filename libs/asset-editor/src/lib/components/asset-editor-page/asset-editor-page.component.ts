import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { AppPortalService, LifecycleHooks, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable, asyncScheduler, observeOn, of } from 'rxjs';

import { TabPageBridgeService } from '../../services/tab-page-bridge.service';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-page',
  templateUrl: './asset-editor-page.component.html',
  styleUrls: ['./asset-editor-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TabPageBridgeService],
})
export class AssetEditorPageComponent {
  @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _cd = inject(ChangeDetectorRef);
  private _tabPageBridgeService = inject(TabPageBridgeService);

  constructor() {
    this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this._appPortalService.setAppBarPortalContent(null);
      this._appPortalService.setDrawerPortalContent(
        new TemplatePortal(this._templateDrawerPortalContent, this._viewContainerRef)
      );
      this._cd.detectChanges();
    });
  }

  public canLeave(): Observable<boolean> {
    if (!this._tabPageBridgeService.tabPage) return of(true);
    return this._tabPageBridgeService.tabPage.canLeave();
  }
}
