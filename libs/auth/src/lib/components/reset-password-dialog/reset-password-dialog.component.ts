import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as RD from '@devexperts/remote-data-ts';
import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Subject, filter, map, mergeMap, withLatestFrom } from 'rxjs';
import { Equals, assert } from 'tsafe';

import { isHttpErrorResponseError } from '@asset-sg/client-shared';
import { OO } from '@asset-sg/core';

import { PasswordHashParams } from '../../models';
import { AuthErrorPayload } from '../../models/error-payload';
import { AuthService } from '../../services/auth.service';

@UntilDestroy()
@Component({
    selector: 'asset-sg-reset-password-dialog',
    templateUrl: './reset-password-dialog.component.html',
    styleUrls: ['./reset-password-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'asset-sg-dialog',
    },
})
export class ResetPasswordDialogComponent extends RxState<ResetPasswordState> {
    public dialogRef = inject(DialogRef<never>);
    private router = inject(Router);
    private authService = inject(AuthService);
    private dcmnt = inject(DOCUMENT);
    private data: { hashParams: PasswordHashParams } = inject(DIALOG_DATA);

    public state$ = this.select();
    public enterPassword$ = new Subject<string>();
    public closeForUnauthorisedClientClicked$ = new Subject<void>();

    public ResetPasswordState = ResetPasswordState;

    constructor() {
        super();

        this.set(ResetPasswordState.of.initial({}));

        if (this.data.hashParams.hashParamsStatus === 'success') {
            this.set(ResetPasswordState.of.enterNewPassword({ accessToken: this.data.hashParams.access_token }));
        } else {
            this.set(ResetPasswordState.of.unauthorisedClient({}));
        }

        this.closeForUnauthorisedClientClicked$.pipe(untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close();
            this.router.navigate(['/']);
        });

        const newPasswordResult$ = this.enterPassword$.pipe(
            withLatestFrom(this.state$),
            map(([newPassword, state]) =>
                ResetPasswordState.is.enterNewPassword(state)
                    ? O.some({ newPassword, accessToken: state.accessToken })
                    : O.none,
            ),
            OO.fromFilteredSome,
            mergeMap(({ accessToken, newPassword }) =>
                this.authService.changePassword(accessToken, newPassword).pipe(
                    map(
                        RD.fold3(
                            () => ResetPasswordState.of.passwordChangePending({}),
                            e => {
                                return ResetPasswordState.of.passwordChangeFailure({
                                    error: pipe(
                                        e,
                                        O.fromPredicate(isHttpErrorResponseError),
                                        O.chain(e => pipe(AuthErrorPayload.decode(e.cause.error), O.fromEither)),
                                    ),
                                });
                            },
                            () => ResetPasswordState.of.passwordChangeSuccess({}),
                        ),
                    ),
                ),
            ),
        );
        this.connect(newPasswordResult$, (_, nextState) => nextState);

        this.state$.pipe(filter(ResetPasswordState.is.passwordChangeSuccess), untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close();
            this.router.navigate(['/de']);
        });
    }
}

interface InitialState {
    _tag: 'initial';
}

interface EnterNewPassword {
    _tag: 'enterNewPassword';
    accessToken: string;
}

interface UnauthorisedClient {
    _tag: 'unauthorisedClient';
}

interface PasswordChangePending {
    _tag: 'passwordChangePending';
}

interface PasswordChangeSuccess {
    _tag: 'passwordChangeSuccess';
}

interface PasswordChangeFailure {
    _tag: 'passwordChangeFailure';
    error: O.Option<AuthErrorPayload>;
}

const ResetPasswordState = makeADT('_tag')({
    initial: ofType<InitialState>(),
    enterNewPassword: ofType<EnterNewPassword>(),
    unauthorisedClient: ofType<UnauthorisedClient>(),
    passwordChangePending: ofType<PasswordChangePending>(),
    passwordChangeSuccess: ofType<PasswordChangeSuccess>(),
    passwordChangeFailure: ofType<PasswordChangeFailure>(),
});

type ResetPasswordState =
    | InitialState
    | UnauthorisedClient
    | EnterNewPassword
    | PasswordChangePending
    | PasswordChangeSuccess
    | PasswordChangeFailure;
assert<Equals<ResetPasswordState, ADTType<typeof ResetPasswordState>>>();
