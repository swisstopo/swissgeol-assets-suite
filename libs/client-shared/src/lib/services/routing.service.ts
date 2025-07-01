import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly router = inject(Router);
  private previousUrl: string | null = null;
  private currentUrl: string;

  private readonly languageService = inject(LanguageService);

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(filter((it) => it instanceof NavigationEnd)).subscribe((event) => {
      this.previousUrl = this.currentUrl;
      this.currentUrl = event.url;
    });
  }

  public rootPath(): string {
    return `/${this.languageService.language}`;
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
