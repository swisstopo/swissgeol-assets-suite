import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule, NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import locale_deCH from '@angular/common/locales/de-CH';
import { inject, NgModule } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthInterceptor, AuthModule, ErrorService } from '@asset-sg/auth';
import {
  AdminOnlyDirective,
  AlertModule,
  AnchorComponent,
  ButtonComponent,
  CanCreateDirective,
  CURRENT_LANG,
  currentLangFactory,
  icons,
  TranslateTsLoader,
} from '@asset-sg/client-shared';
import { assetsPageMatcher } from '@asset-sg/client-shared';
import { storeLogger } from '@asset-sg/core';
import { provideSvgIcons, SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { FullRouterStateSerializer, routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';

import { environment } from '../environments/environment';

import { adminGuard } from './app-guards';
import { AppComponent } from './app.component';
import { AppBarComponent, MenuBarComponent, NotFoundComponent, RedirectToLangComponent } from './components';
import { MenuBarItemComponent } from './components/menu-bar-item/menu-bar-item.component';
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
    MenuBarItemComponent,
    SplashScreenComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([
      {
        path: ':lang/admin',
        loadChildren: () => import('@asset-sg/admin').then((m) => m.AdminModule),
        canActivate: [adminGuard],
      },
      {
        path: ':lang/asset-admin',
        loadChildren: () => import('@asset-sg/asset-editor').then((m) => m.AssetEditorModule),
      },
      {
        matcher: assetsPageMatcher,
        loadChildren: () => import('@asset-sg/asset-viewer').then((m) => m.AssetViewerModule),
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
      }
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
    AdminOnlyDirective,
    CanCreateDirective,
    MatTooltip,
    MatButton,
    MatMenuTrigger,
    MatMenu,
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
