import { Injectable, inject } from '@angular/core';
import { Lazy } from 'fp-ts/function';
import { WINDOW } from 'ngx-window-token';

@Injectable({ providedIn: 'root' })
export class WindowService {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    private _wndw = inject(WINDOW)!;

    public delayRequestAnimationFrame(ms: number, f: Lazy<void>): Promise<void> {
        return new Promise(resolve => {
            setTimeout(
                () =>
                    this._wndw.requestAnimationFrame(() => {
                        try {
                            f();
                        } finally {
                            resolve();
                        }
                    }),
                ms,
            );
        });
    }
}
