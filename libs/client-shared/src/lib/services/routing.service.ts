import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Lang } from '@asset-sg/shared';
import { filter, take } from 'rxjs';
import { CURRENT_LANG } from '../utils';

@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private previousUrl: string | null = null;

  private currentLang: Lang = 'de';
  private readonly currentLang$ = inject(CURRENT_LANG);

  constructor() {
    this.router.events
      .pipe(
        filter((it) => it instanceof NavigationEnd),
        take(1)
      )
      .subscribe((event) => {
        this.previousUrl = event.url;
      });

    this.currentLang$.subscribe((lang) => {
      this.currentLang = lang;
    });
  }

  public rootPath(): string {
    return `/${this.currentLang}`;
  }

  public async navigateToRoot(): Promise<void> {
    await this.router.navigate([this.rootPath()]);
  }

  public async navigateBack(fallback?: string[]): Promise<void> {
    if (this.previousUrl === null || document.location.pathname === this.previousUrl) {
      await this.router.navigate(fallback ?? [this.rootPath()]);
    } else {
      await this.router.navigate([this.previousUrl]);
    }
  }
}
