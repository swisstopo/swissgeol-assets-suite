import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as E from 'fp-ts/Either';

import { passwordHashParams } from '../../models';
import { SetPasswordDialogComponent } from '../set-password-dialog/set-password-dialog.component';

@Component({
    selector: 'asset-sg-aset-password-page',
    template: '',
    styleUrls: ['./set-password-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetPasswordPageComponent {
    private dcmnt = inject(DOCUMENT);
    private router = inject(Router);

    constructor(private dialog: Dialog) {
        const hashParamsDecoded = passwordHashParams('invite').decode(this.dcmnt.location.hash);
        console.log({ hashParamsDecoded });
        if (E.isRight(hashParamsDecoded)) {
            this.dialog.open(SetPasswordDialogComponent, {
                disableClose: true,
                data: { hashParams: hashParamsDecoded.right },
            });
        } else {
            this.router.navigate(['/']);
        }
    }
}
