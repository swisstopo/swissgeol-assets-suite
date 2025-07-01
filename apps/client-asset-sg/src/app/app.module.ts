import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule, NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import locale_deCH from '@angular/common/locales/de-CH';
import { NgModule } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import {
  isAdminGuard,
  AdminOnlyDirective,
  AlertModule,
  AnchorComponent,
  AuthModule,
  ButtonComponent,
  ErrorService,
  prefixPathWithLanguageGuard,
  redirectToRootGuard,
  icons,
  LanguageSelectorComponent,
  LocalizePathPipe,
  ROUTER_SEGMENTS,
  routerSegmentsFactory,
  TranslateTsLoader,
} from '@asset-sg/client-shared';
import { storeLogger } from '@asset-sg/core';
import { provideSvgIcons, SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { FullRouterStateSerializer, routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';

import { SwissgeolCoreModule } from '@swissgeol/ui-core-angular';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppBarComponent, MenuBarComponent, NotFoundComponent } from './components';
import { GoogleAnalyticsComponent } from './components/google-analytics/google-analytics.component';
import { MenuBarItemComponent } from './components/menu-bar-item/menu-bar-item.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { appTranslations } from './i18n';
import { HttpInterceptor } from './services/http.interceptor';
import { AppSharedStateEffects } from './state';
import { appSharedStateReducer } from './state/app-shared.reducer';

registerLocaleData(locale_deCH, 'de-CH');

const loadAssetViewer = () => import('@asset-sg/asset-viewer').then((m) => m.AssetViewerModule);

const routes: Routes = [
  {
    path: ':lang',
    canMatch: [prefixPathWithLanguageGuard],
    children: [
      {
        path: '',
        loadChildren: loadAssetViewer,
      },
      {
        path: 'assets',
        loadChildren: loadAssetViewer,
      },
      {
        path: 'favorites',
        loadChildren: loadAssetViewer,
      },
      {
        path: 'asset-admin',
        loadChildren: () => import('@asset-sg/asset-editor').then((m) => m.AssetEditorModule),
      },
      {
        path: 'admin',
        loadChildren: () => import('@asset-sg/admin').then((m) => m.AdminModule),
        canActivate: [isAdminGuard],
      },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
    canMatch: [redirectToRootGuard],
  },
];

@NgModule({
  declarations: [
    AppComponent,
    GoogleAnalyticsComponent,
    NotFoundComponent,
    AppBarComponent,
    MenuBarComponent,
    MenuBarItemComponent,
    SplashScreenComponent,
  ],
  imports: [
    RouterModule.forRoot(routes),

    SwissgeolCoreModule,
    CommonModule,
    BrowserModule,
    AuthModule,
    BrowserAnimationsModule,
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
    AdminOnlyDirective,
    MatTooltip,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    LanguageSelectorComponent,
    MatDivider,
    MatDialogContent,
    MatDialogActions,
    MatBadge,
    LocalizePathPipe,
  ],
  providers: [
    provideSvgIcons(icons),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    ErrorService,

    { provide: ROUTER_SEGMENTS, useFactory: routerSegmentsFactory },
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', floatLabel: 'auto' } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
