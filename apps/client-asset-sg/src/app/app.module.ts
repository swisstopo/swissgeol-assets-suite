import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import locale_deCH from '@angular/common/locales/de-CH';
import { inject, NgModule } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { provideSvgIcons, SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { FullRouterStateSerializer, routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import * as O from 'fp-ts/Option';
import * as C from 'io-ts/Codec';

import { AuthInterceptor } from '@asset-sg/auth';
import {
    AnchorComponent,
    ButtonComponent,
    CURRENT_LANG,
    currentLangFactory,
    icons,
    TranslateTsLoader,
} from '@asset-sg/client-shared';
import { storeLogger } from '@asset-sg/core';

import { environment } from '../environments/environment';

import { adminGuard, editorGuard } from './app-guards';
import { assetsPageMatcher } from './app-matchers';
import { AppComponent } from './app.component';
import { AppBarComponent, MenuBarComponent, NotFoundComponent, RedirectToLangComponent } from './components';
import { appTranslations } from './i18n';
import { AppSharedStateEffects } from './state';
import { appSharedStateReducer } from './state/app-shared.reducer';
import { OAuthModule } from 'angular-oauth2-oidc';

registerLocaleData(locale_deCH, 'de-CH');

@NgModule({
    declarations: [AppComponent, RedirectToLangComponent, NotFoundComponent, AppBarComponent, MenuBarComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot([
            {
                path: ':lang/a',
                loadChildren: () => import('@asset-sg/auth').then(m => m.AuthModule),
            },
            {
                path: ':lang/profile',
                loadChildren: () => import('@asset-sg/profile').then(m => m.ProfileModule),
            },
            {
                path: ':lang/admin',
                loadChildren: () => import('@asset-sg/admin').then(m => m.AdminModule),
                canActivate: [adminGuard],
            },
            {
                path: ':lang/asset-admin',
                loadChildren: () => import('@asset-sg/asset-editor').then(m => m.AssetEditorModule),
                canActivate: [editorGuard],
            },
            {
                matcher: assetsPageMatcher,
                loadChildren: () => import('@asset-sg/asset-viewer').then(m => m.AssetViewerModule),
            },
            {
                path: 'not-found',
                component: NotFoundComponent,
            },
            {
                path: '**',
                component: RedirectToLangComponent,
            },
        ]),
        TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useFactory: () => new TranslateTsLoader(appTranslations) },
        }),
        StoreRouterConnectingModule.forRoot({ serializer: FullRouterStateSerializer, stateKey: 'router' }),
        StoreModule.forRoot(
            { router: routerReducer, shared: appSharedStateReducer },
            {
                metaReducers: environment.ngrxStoreLoggerEnabled ? [storeLogger()] : [],
                runtimeChecks: {
                    strictStateImmutability: false,
                },
            },
        ),
        EffectsModule.forRoot([AppSharedStateEffects]),
        ForModule,
        LetModule,
        PushModule,

        SvgIconComponent,

        AnchorComponent,
        ButtonComponent,
        DialogModule,
        A11yModule,
        // AuthModule,
        OAuthModule.forRoot({
            resourceServer: {
                sendAccessToken: true,
                //allowedUrls:['http://localhost:3000'],
            },
        }),
    ],
    providers: [
        provideSvgIcons(icons),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', floatLabel: 'auto' } },
        { provide: CURRENT_LANG, useFactory: currentLangFactory },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    private _translateService = inject(TranslateService);

    constructor() {
        this._translateService.setDefaultLang('de');
    }
}

export interface Encoder<O, A> {
    readonly encode: (a: A) => O;
}

function optionFromNullable<O, A>(encoder: Encoder<O, A>): Encoder<O | null, O.Option<A>> {
    return {
        encode: O.fold(() => null, encoder.encode),
    };
}

const foooobar = optionFromNullable(C.string);
