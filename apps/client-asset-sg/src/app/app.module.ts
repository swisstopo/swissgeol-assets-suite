import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule, NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import locale_deCH from '@angular/common/locales/de-CH';
import { inject, NgModule } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import {
  AdminOnlyDirective,
  AlertModule,
  AnchorComponent,
  assetsPageMatcher,
  AuthModule,
  ButtonComponent,
  CanCreateDirective,
  CURRENT_LANG,
  currentLangFactory,
  ErrorService,
  icons,
  LanguageSelectorComponent,
  TranslateTsLoader,
} from '@asset-sg/client-shared';
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
import { HttpInterceptor } from './services/http.interceptor';
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
    AuthModule,
    BrowserAnimationsModule,
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
    LanguageSelectorComponent,
    MatDivider,
    MatDialogContent,
    MatDialogActions,
  ],
  providers: [
    provideSvgIcons(icons),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    ErrorService,
    { provide: CURRENT_LANG, useFactory: currentLangFactory },
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', floatLabel: 'auto' } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  private readonly translateService = inject(TranslateService);

  constructor() {
    this.translateService.setDefaultLang('de');
  }
}

export interface Encoder<O, A> {
  readonly encode: (a: A) => O;
}
