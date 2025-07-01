import { Component, inject } from '@angular/core';
import { AuthService, AuthState, LanguageService } from '@asset-sg/client-shared';
import { Language } from '@swissgeol/ui-core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: false,
})
export class SplashScreenComponent {
  readonly authService = inject(AuthService);

  private readonly languageService = inject(LanguageService);

  public readonly languageInfos$ = this.languageService.languageInfos$;

  get host(): string {
    return window.location.host;
  }

  selectLanguage(language: Language): void {
    this.languageService.setLanguage(language);
  }

  protected readonly AuthState = AuthState;
}
