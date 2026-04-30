import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { AppPortalService, LifecycleHooks, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { asyncScheduler, observeOn } from 'rxjs';

@Component({
  selector: 'asset-sg-editor-launch',
  templateUrl: './asset-editor-launch.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [LifecycleHooksDirective],
  styleUrls: ['./asset-editor-launch.component.scss'],
  standalone: false,
})
export class AssetEditorLaunchComponent implements OnDestroy {
  // @TODO: VEJ 13.04.2025 This component is the launcher for the admin module. It is wrongly named and located.
  //  It should be deleted and the options should be moved to the admin page directly.

  @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly lc = inject(LifecycleHooks);
  private readonly appPortalService = inject(AppPortalService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly cd = inject(ChangeDetectorRef);

  constructor() {
    this.lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this.appPortalService.setAppBarPortalContent(null);
      this.appPortalService.setDrawerPortalContent(
        new TemplatePortal(this._templateDrawerPortalContent, this.viewContainerRef),
      );
      this.cd.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.appPortalService.setAppBarPortalContent(null);
    this.appPortalService.setDrawerPortalContent(null);
  }
}
