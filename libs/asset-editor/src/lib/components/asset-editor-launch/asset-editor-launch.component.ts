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
export class AssetEditorLaunchComponent {
  @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _cd = inject(ChangeDetectorRef);
  private _store = inject<Store<AppState>>(Store);
  public readonly currentLang$ = inject(CURRENT_LANG);

  constructor() {
    this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this._appPortalService.setAppBarPortalContent(null);
      this._appPortalService.setDrawerPortalContent(
        new TemplatePortal(this._templateDrawerPortalContent, this._viewContainerRef)
      );
      this._cd.detectChanges();
      this._store.dispatch(appSharedStateActions.openPanel());
    });
  }
}
