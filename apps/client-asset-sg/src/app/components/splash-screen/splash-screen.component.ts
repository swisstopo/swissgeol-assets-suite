import { Component, inject } from '@angular/core';
import { AuthService, AuthState, CURRENT_LANG } from '@asset-sg/client-shared';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent {
  readonly authService = inject(AuthService);
  readonly currentLang$ = inject(CURRENT_LANG);
  private readonly translateService = inject(TranslateService);

  get host(): string {
    return window.location.host;
  }

  selectLanguage(language: string): void {
    this.translateService.use(language);
  }

  protected readonly AuthState = AuthState;
}
