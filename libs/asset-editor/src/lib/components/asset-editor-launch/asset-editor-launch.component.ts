import { TemplatePortal } from '@angular/cdk/portal';
import { HttpClient } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, asyncScheduler, observeOn, take } from 'rxjs';

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
    styleUrls: ['./asset-editor-launch.component.scss'],
})
export class AssetEditorLaunchComponent implements OnInit {
    @ViewChild('templateDrawerPortalContent') _templateDrawerPortalContent!: TemplateRef<unknown>;

    private _lc = inject(LifecycleHooks);
    private _appPortalService = inject(AppPortalService);
    private _viewContainerRef = inject(ViewContainerRef);
    private _cd = inject(ChangeDetectorRef);
    private _store = inject<Store<AppState>>(Store);
    private _httpClient = inject(HttpClient);

    syncProgress: number | null = null;

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

    ngOnInit() {
        void this.refreshAssetSyncProgress().then(() => {
            if (this.syncProgress != null) {
                void this.loopAssetSyncProgress();
            }
        });
    }

    async synchronizeElastic() {
        if (this.syncProgress !== null) {
            return;
        }
        this.syncProgress = 0;
        await resolveFirst(this._httpClient.post('/api/assets/sync', null))
        await this.loopAssetSyncProgress();
    }

    private async loopAssetSyncProgress() {
        while (this.syncProgress !== null) {
            await this.refreshAssetSyncProgress();
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    private async refreshAssetSyncProgress() {
        type Progress = { progress: number } | null | undefined;
        const progress = await resolveFirst(this._httpClient.get<Progress>('/api/assets/sync'))
        this.syncProgress = progress == null ? null : Math.round(progress.progress * 100);
    }
}

const resolveFirst = <T>(value$: Observable<T>): Promise<T> => (
    new Promise((resolve, reject) => {
        value$.pipe(take(1)).subscribe({
            next: resolve,
            error: reject,
        })
    })
)
