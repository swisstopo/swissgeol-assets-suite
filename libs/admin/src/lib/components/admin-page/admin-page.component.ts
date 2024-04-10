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
import { asyncScheduler, observeOn, takeWhile } from 'rxjs';

import {
    AppPortalService,
    AppState,
    LifecycleHooks,
    LifecycleHooksDirective,
    fromAppShared,
} from '@asset-sg/client-shared';
import { ORD, rdIsNotComplete } from '@asset-sg/core';
import { User } from '@asset-sg/shared';

import { AdminService } from '../../services/admin.service';
import { UserExpandedOutput } from '../user-expanded';

import { AdminPageStateMachine } from './admin-page.state-machine';

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
    private _adminService = inject(AdminService);
    private _store = inject(Store<AppState>);

    public sm = new AdminPageStateMachine({
        rdUserId$: this._store.select(fromAppShared.selectRDUserProfile).pipe(
            ORD.map(u => u.id),
            takeWhile(rdIsNotComplete, true),
        ),
        getUsers: () => this._adminService.getUsers(),
        updateUser: user => this._adminService.updateUser(user),
        deleteUser: id => this._adminService.deleteUser(id),
    });

    constructor() {
        this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
            this._appPortalService.setAppBarPortalContent(null);
            this._appPortalService.setDrawerPortalContent(
                new TemplatePortal(this.templateDrawerPortalContent, this._viewContainerRef),
            );
            this._cd.detectChanges();
        });
    }

    public handleUserExpandedOutput(output: UserExpandedOutput): void {
        UserExpandedOutput.match({
            userEdited: user => this.sm.saveEditedUser(user),
            userExpandCanceled: () => this.sm.cancelEditOrSave(),
            userDelete: user => this.sm.deleteUser(user.id),
        })(output);
    }

    public trackByFn(_: number, item: User): string {
        return item.id;
    }
}
