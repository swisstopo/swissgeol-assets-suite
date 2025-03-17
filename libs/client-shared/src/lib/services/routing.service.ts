import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Lang } from '@asset-sg/shared';
import { filter } from 'rxjs';
import { CURRENT_LANG } from '../utils';

@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly router = inject(Router);
  private previousUrl: string | null = null;
  private currentUrl: string;

  private currentLang: Lang = 'de';
  private readonly currentLang$ = inject(CURRENT_LANG);

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(filter((it) => it instanceof NavigationEnd)).subscribe((event) => {
      this.previousUrl = this.currentUrl;
      this.currentUrl = event.url;
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
      await this.router.navigateByUrl(this.previousUrl);
    }
  }
}
