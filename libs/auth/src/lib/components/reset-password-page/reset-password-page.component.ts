import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as E from 'fp-ts/Either';

import { passwordHashParams } from '../../models/hash-params';
import { ResetPasswordDialogComponent } from '../reset-password-dialog';

@Component({
    selector: 'asset-sg-reset-password-page',
    template: '',
    styleUrls: ['./reset-password-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent {
    private dcmnt = inject(DOCUMENT);
    private router = inject(Router);

    constructor(private dialog: Dialog) {
        const hashParamsDecoded = passwordHashParams('recovery').decode(this.dcmnt.location.hash);
        if (E.isRight(hashParamsDecoded)) {
            this.dialog.open(ResetPasswordDialogComponent, {
                disableClose: true,
                data: { hashParams: hashParamsDecoded.right },
            });
        } else {
            this.router.navigate(['/']);
        }
    }
}
