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
import { Store } from '@ngrx/store';
import { asyncScheduler, observeOn } from 'rxjs';

import {
    AppPortalService,
    AppState,
    LifecycleHooks,
    LifecycleHooksDirective,
    appSharedStateActions,
} from '@asset-sg/client-shared';

@Component({
    selector: 'asset-sg-editor-launch',
    templateUrl: './asset-editor-launch.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [LifecycleHooksDirective],
})
export class AssetEditorLaunchComponent {
    @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

    private _lc = inject(LifecycleHooks);
    private _appPortalService = inject(AppPortalService);
    private _viewContainerRef = inject(ViewContainerRef);
    private _cd = inject(ChangeDetectorRef);
    private _store = inject<Store<AppState>>(Store);

    constructor() {
        this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
            this._appPortalService.setAppBarPortalContent(null);
            this._appPortalService.setDrawerPortalContent(
                new TemplatePortal(this._templateDrawerPortalContent, this._viewContainerRef),
            );
            this._cd.detectChanges();
            this._store.dispatch(appSharedStateActions.openPanel());
        });
    }
}
