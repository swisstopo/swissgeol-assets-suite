import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { provideSvgIcons } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { OAuthModule } from 'angular-oauth2-oidc';

import { AnchorComponent, ButtonComponent, icons } from '@asset-sg/client-shared';

import { ResetPasswordDialogComponent } from './components/reset-password-dialog';
import { ResetPasswordPageComponent } from './components/reset-password-page';
import { SetPasswordDialogComponent } from './components/set-password-dialog/set-password-dialog.component';
import { SetPasswordPageComponent } from './components/set-password-page';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: 'reset-password',
                component: ResetPasswordPageComponent,
            },
            {
                path: 'set-password',
                component: SetPasswordPageComponent,
            },
        ]),
        A11yModule,
        // TODO: This is not working. The translations are not loaded.
        TranslateModule.forChild({}),
        // TranslateModule.forChild({
        //     loader: { provide: TranslateLoader, useFactory: () => new TranslateTsLoader(authTranslations) },
        //     extend: true,
        // }),
        ForModule,
        LetModule,
        PushModule,
        DialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        ButtonComponent,
        AnchorComponent,
        OAuthModule.forRoot({
            resourceServer: {
                sendAccessToken: true,
                allowedUrls: [],
                customUrlValidation: (url: string) => !url.includes('oauth2/token'),
            },
        }),
    ],
    exports: [OAuthModule],
    providers: [provideSvgIcons(icons)],
    declarations: [ResetPasswordDialogComponent, SetPasswordDialogComponent],
})
export class AuthModule {}
