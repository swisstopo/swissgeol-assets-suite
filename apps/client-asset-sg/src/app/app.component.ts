import { Component, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WINDOW } from 'ngx-window-token';
import { debounceTime, fromEvent, startWith } from 'rxjs';
import { assert } from 'tsafe';

import { AppPortalService, setCssCustomProperties } from '@asset-sg/client-shared';
import { FavouriteService } from '@asset-sg/favourite';
import { AuthService } from '@asset-sg/auth';

const fullHdWidth = 1920;

@UntilDestroy()
@Component({
    selector: 'asset-sg-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    private _wndw = inject(WINDOW);

    public appPortalService = inject(AppPortalService);
    private _favouriteService = inject(FavouriteService);
    private _authService = inject(AuthService);

    constructor() {
        this._authService.init();
        
        const wndw = this._wndw;
        assert(wndw != null);

        fromEvent(wndw, 'resize')
            .pipe(debounceTime(50), startWith(null), untilDestroyed(this))
            .subscribe(() => {
                let fontSize = '1rem';
                const width = window.innerWidth;
                if (width >= fullHdWidth) {
                    fontSize = '1rem';
                } else if (width >= 0.8 * fullHdWidth) {
                    fontSize = `${width / fullHdWidth}rem`;
                } else {
                    fontSize = '0.8rem';
                }
                setCssCustomProperties(wndw.document.documentElement, ['font-size', fontSize]);
            });
    }
}
