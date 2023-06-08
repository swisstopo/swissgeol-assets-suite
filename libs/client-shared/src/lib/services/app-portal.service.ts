import { Portal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppPortalService {
    private _appBarPortalContent$ = new Subject<Portal<unknown> | null>();
    public setAppBarPortalContent(portal: Portal<unknown> | null) {
        this._appBarPortalContent$.next(portal);
    }
    public appBarPortalContent$ = this._appBarPortalContent$.asObservable();

    private _drawerPortalContent$ = new Subject<Portal<unknown> | null>();
    public setDrawerPortalContent(portal: Portal<unknown> | null) {
        this._drawerPortalContent$.next(portal);
    }
    public drawerPortalContent$ = this._drawerPortalContent$.asObservable();
}
