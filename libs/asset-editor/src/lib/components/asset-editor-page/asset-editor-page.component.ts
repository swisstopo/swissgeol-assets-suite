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
  standalone: false,
})
export class AssetEditorPageComponent {
  @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly lc = inject(LifecycleHooks);
  private readonly appPortalService = inject(AppPortalService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly tabPageBridgeService = inject(TabPageBridgeService);

  constructor() {
    this.lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this.appPortalService.setAppBarPortalContent(null);
      this.appPortalService.setDrawerPortalContent(
        new TemplatePortal(this._templateDrawerPortalContent, this.viewContainerRef)
      );
      this.cd.detectChanges();
    });
  }

  public canLeave(): Observable<boolean> {
    if (!this.tabPageBridgeService.tabPage) return of(true);
    return this.tabPageBridgeService.tabPage.canLeave();
  }
}
