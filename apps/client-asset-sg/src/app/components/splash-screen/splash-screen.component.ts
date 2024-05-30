import { Component, inject } from '@angular/core';
import { Observable, map, startWith } from 'rxjs';

import { AuthService, AuthState } from '@asset-sg/auth';
import { CURRENT_LANG } from '@asset-sg/client-shared';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent {
  readonly authService = inject(AuthService);
  private readonly currentLang$ = inject(CURRENT_LANG);

  constructor() {
    this.languages$.subscribe(lang => {
      console.log(lang);
    });
  }

  get host(): string {
    return window.location.host;
  }

  get languages$(): Observable<Array<{ name: string; isActive: boolean }>> {
    return this.currentLang$.pipe(
      startWith('de'),
      map(lang =>
        ['de', 'fr', 'it', 'rm', 'en'].map(it => ({
          name: it,
          isActive: lang === it,
        })),
      ),
    );
  }

  protected readonly AuthState = AuthState;
}
