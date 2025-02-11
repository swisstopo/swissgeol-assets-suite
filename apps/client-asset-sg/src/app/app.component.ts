import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AppPortalService,
  appSharedStateActions,
  AuthService,
  AuthState,
  ConfigService,
  ErrorService,
  setCssCustomProperties,
} from '@asset-sg/client-shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { debounceTime, fromEvent, startWith, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { AppState } from './state/app-state';

const fullHdWidth = 1920;

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

  public readonly errorService = inject(ErrorService);
  public readonly authService = inject(AuthService);
  private readonly store = inject(Store<AppState>);
  private readonly configService = inject(ConfigService);

  constructor() {
    this.configService.setHideDisclaimer(environment.hideDisclaimer);
    this.httpClient
      .get<Record<string, unknown>>('api/oauth-config/config')
      .pipe(switchMap(async (config) => await this.authService.initialize(config)))
      .subscribe(async () => {
        this.store.dispatch(appSharedStateActions.loadWorkgroups());
        this.store.dispatch(appSharedStateActions.loadReferenceData());
      });

    fromEvent(window, 'resize')
      .pipe(debounceTime(50), startWith(null), untilDestroyed(this))
      .subscribe(() => {
        let fontSize;
        const width = window.innerWidth;
        if (width >= fullHdWidth) {
          fontSize = '1rem';
        } else if (width >= 0.8 * fullHdWidth) {
          fontSize = `${width / fullHdWidth}rem`;
        } else {
          fontSize = '0.8rem';
        }
        setCssCustomProperties(document.documentElement, ['font-size', fontSize]);
      });
  }

  protected readonly AuthState = AuthState;
}
