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
import {
  AppPortalService,
  appSharedStateActions,
  AppState,
  CURRENT_LANG,
  LifecycleHooks,
  LifecycleHooksDirective,
} from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';
import { asyncScheduler, observeOn } from 'rxjs';

@Component({
  selector: 'asset-sg-editor-launch',
  templateUrl: './asset-editor-launch.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [LifecycleHooksDirective],
  styleUrls: ['./asset-editor-launch.component.scss'],
})
export class AssetEditorLaunchComponent implements OnDestroy {
  @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly lc = inject(LifecycleHooks);
  private readonly appPortalService = inject(AppPortalService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly store = inject<Store<AppState>>(Store);
  public readonly currentLang$ = inject(CURRENT_LANG);

  constructor() {
    this.lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this.appPortalService.setAppBarPortalContent(null);
      this.appPortalService.setDrawerPortalContent(
        new TemplatePortal(this._templateDrawerPortalContent, this.viewContainerRef)
      );
      this.cd.detectChanges();
      this.store.dispatch(appSharedStateActions.openPanel());
    });
  }

  ngOnDestroy(): void {
    this.appPortalService.setAppBarPortalContent(null);
    this.appPortalService.setDrawerPortalContent(null);
  }
}
