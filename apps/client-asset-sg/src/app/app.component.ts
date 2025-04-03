import { HttpClient } from '@angular/common/http';
import { Component, HostBinding, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AppPortalService,
  appSharedStateActions,
  AuthService,
  AuthState,
  ConfigService,
  ErrorService,
  fromAppShared,
} from '@asset-sg/client-shared';
import { AppConfig } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, filter, identity, map, startWith, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { AppState } from './state/app-state';

@UntilDestroy()
@Component({
  selector: 'asset-sg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private readonly httpClient = inject(HttpClient);
  public readonly appPortalService = inject(AppPortalService);
  public shouldShowMenuBar = true;

  public readonly errorService = inject(ErrorService);
  public readonly authService = inject(AuthService);
  private readonly store = inject(Store<AppState>);
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);

  private readonly hasConsentedToTracking$ = this.store.select(fromAppShared.selectHasConsentedToTracking);
  private readonly config$ = new BehaviorSubject<AppConfig | null>(null);
  readonly googleAnalyticsId$ = this.hasConsentedToTracking$.pipe(
    filter(identity),
    switchMap(() => this.config$),
    map((config) => config?.googleAnalyticsId),
    filter((id) => id != null)
  );

  constructor() {
    this.configService.setHideDisclaimer(environment.hideDisclaimer);

    this.httpClient
      .get<AppConfig>('api/config')
      .pipe(
        switchMap(async (config) => {
          await this.authService.initialize(config);
          return config;
        })
      )
      .subscribe(async (config) => {
        this.config$.next(config);
        this.store.dispatch(appSharedStateActions.loadWorkgroups());
        this.store.dispatch(appSharedStateActions.loadReferenceData());
      });

    this.router.events
      .pipe(
        untilDestroyed(this),
        filter((event) => event instanceof NavigationEnd),
        startWith(() => undefined),
        map(() => {
          const segments = (this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation)?.finalUrl?.root
            .children['primary']?.segments;
          if (segments == null || segments.length === 1) {
            return true;
          }
          const path = segments.slice(1).join('/');
          return !(path === 'admin' || path.startsWith(`admin/`) || path.startsWith('asset-admin/'));
        })
      )
      .subscribe((showMenuBar) => {
        this.shouldShowMenuBar = showMenuBar;
      });
  }

  @HostBinding('class.menu-hidden')
  get isMenuHidden() {
    return !this.shouldShowMenuBar;
  }

  protected readonly AuthState = AuthState;
}
