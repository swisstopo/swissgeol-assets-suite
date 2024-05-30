import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule, NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import locale_deCH from '@angular/common/locales/de-CH';
import { NgModule, inject } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { SvgIconComponent, provideSvgIcons } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { FullRouterStateSerializer, StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';

import { AuthInterceptor, AuthModule, ErrorService } from '@asset-sg/auth';
import {
  AlertModule,
  AnchorComponent,
  ButtonComponent,
  CURRENT_LANG,
  TranslateTsLoader,
  currentLangFactory,
  icons,
} from '@asset-sg/client-shared';
import { storeLogger } from '@asset-sg/core';

import { environment } from '../environments/environment';

import { adminGuard, editorGuard } from './app-guards';
import { assetsPageMatcher } from './app-matchers';
import { AppComponent } from './app.component';
import { AppBarComponent, MenuBarComponent, NotFoundComponent, RedirectToLangComponent } from './components';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { appTranslations } from './i18n';
import { AppSharedStateEffects } from './state';
import { appSharedStateReducer } from './state/app-shared.reducer';

registerLocaleData(locale_deCH, 'de-CH');

@NgModule({
  declarations: [
    AppComponent,
    RedirectToLangComponent,
    NotFoundComponent,
    AppBarComponent,
    MenuBarComponent,
    SplashScreenComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([
      {
        path: ':lang/auth',
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
    AuthModule,
    AlertModule,
    NgOptimizedImage,
    MatProgressSpinnerModule,
  ],
  providers: [
    provideSvgIcons(icons),
    ErrorService,
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
