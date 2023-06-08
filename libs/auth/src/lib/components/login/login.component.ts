import { A11yModule } from '@angular/cdk/a11y';
import { DialogRef } from '@angular/cdk/dialog';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import * as RD from '@devexperts/remote-data-ts';
import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { Observable, Subject, filter, map, merge, share, startWith, switchMap, withLatestFrom } from 'rxjs';
import { Equals, assert } from 'tsafe';

import {
    AnchorComponent,
    AppState,
    ButtonComponent,
    appSharedStateActions,
    isHttpErrorResponseError,
} from '@asset-sg/client-shared';

import { AuthService } from '../../services/auth.service';

@UntilDestroy()
@Component({
    standalone: true,
    selector: 'asset-sg-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        MatFormFieldModule,
        MatInputModule,
        TranslateModule,
        PushModule,
        LetModule,
        CommonModule,
        AnchorComponent,
        ButtonComponent,
        A11yModule,
        MatProgressBarModule,
    ],
    host: {
        class: 'asset-sg-dialog',
    },
})
export class LoginComponent {
    public dialogRef = inject(DialogRef<never>);
    private authService = inject(AuthService);
    private formBuilder = inject(FormBuilder);
    private store: Store<AppState> = inject(Store);

    form = this.formBuilder.group({
        email: new FormControl<string>('', { nonNullable: true }),
        password: new FormControl('', { nonNullable: true }),
    });

    public loginClicked$ = new Subject<void>();
    public requestPasswordRecoverClicked$ = new Subject<void>();
    public backToLoginClicked$ = new Subject<void>();
    public submitPasswordRecoverClicked$ = new Subject<string>();

    public LoginState = LoginState;
    public state$: Observable<LoginState>;

    constructor() {
        const loginRequest$ = this.loginClicked$.pipe(
            withLatestFrom(this.form.valueChanges),
            switchMap(() => {
                const { email, password } = this.form.getRawValue();
                return this.authService.login(email, password);
            }),
            share(),
        );
        const loginResult$ = loginRequest$.pipe(
            map(
                RD.fold3(
                    () => LoginState.of.loginPending({}),
                    () => LoginState.of.loginFailure({}),
                    () => LoginState.of.loginSuccess({}),
                ),
            ),
            share(),
        );

        const passwordRecoverClicked$ = this.submitPasswordRecoverClicked$.pipe(
            switchMap(email => this.authService.recoverPassword(email)),
            map(
                RD.fold3(
                    () => LoginState.of.recoveryPending({}),
                    e =>
                        isHttpErrorResponseError(e) && e.cause.status === 429
                            ? LoginState.of.recoveryFailureTooManyRequests({})
                            : LoginState.of.recoveryFailure({}),
                    () => LoginState.of.recoverySuccess({}),
                ),
            ),
        );

        this.state$ = merge(
            loginResult$,
            passwordRecoverClicked$,
            this.requestPasswordRecoverClicked$.pipe(map(() => LoginState.of.enterEmailForRecovery({}))),
            this.backToLoginClicked$.pipe(map(() => LoginState.of.enterLoginDetails({}))),
        ).pipe(startWith(LoginState.of.enterLoginDetails({})));

        loginRequest$.pipe(untilDestroyed(this)).subscribe(u => {
            this.store.dispatch(appSharedStateActions.loadUserProfileResult(u));
        });

        loginResult$.pipe(filter(LoginState.is.loginSuccess), untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close();
        });
    }
}

interface EnterLoginDetails {
    _tag: 'enterLoginDetails';
}
interface LoginPending {
    _tag: 'loginPending';
}
interface LoginSuccess {
    _tag: 'loginSuccess';
}
interface LoginFailure {
    _tag: 'loginFailure';
}
interface EnterEmailForRecovery {
    _tag: 'enterEmailForRecovery';
}
interface RecoveryPending {
    _tag: 'recoveryPending';
}
interface RecoverySuccess {
    _tag: 'recoverySuccess';
}
interface RecoveryFailureTooManyRequests {
    _tag: 'recoveryFailureTooManyRequests';
}
interface RecoveryFailure {
    _tag: 'recoveryFailure';
}

const LoginState = makeADT('_tag')({
    enterLoginDetails: ofType<EnterLoginDetails>(),
    loginPending: ofType<LoginPending>(),
    loginSuccess: ofType<LoginSuccess>(),
    loginFailure: ofType<LoginFailure>(),
    enterEmailForRecovery: ofType<EnterEmailForRecovery>(),
    recoveryPending: ofType<RecoveryPending>(),
    recoverySuccess: ofType<RecoverySuccess>(),
    recoveryFailureTooManyRequests: ofType<RecoveryFailureTooManyRequests>(),
    recoveryFailure: ofType<RecoveryFailure>(),
});

type LoginState =
    | EnterLoginDetails
    | LoginPending
    | LoginSuccess
    | LoginFailure
    | EnterEmailForRecovery
    | RecoveryPending
    | RecoverySuccess
    | RecoveryFailureTooManyRequests
    | RecoveryFailure;
assert<Equals<LoginState, ADTType<typeof LoginState>>>();
