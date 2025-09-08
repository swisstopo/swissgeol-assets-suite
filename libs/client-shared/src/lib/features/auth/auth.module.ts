import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideSvgIcons } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxPush } from '@rx-angular/template/push';
import { OAuthModule } from 'angular-oauth2-oidc';
import { AnchorComponent, ButtonComponent } from '../../components';

import { icons } from '../../icons';
import { ErrorService } from './error.service';

@NgModule({
  imports: [
    CommonModule,
    A11yModule,
    // TODO: This is not working. The translations are not loaded.
    TranslateModule.forChild({}),
    // TranslateModule.forChild({
    //     loader: { provide: TranslateLoader, useFactory: () => new TranslateTsLoader(authTranslations) },
    //     extend: true,
    // }),
    RxFor,
    RxLet,
    RxPush,
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
  providers: [provideSvgIcons(icons), ErrorService],
})
export class AuthModule {}
