import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { AuthService, supportedLangs } from '@asset-sg/client-shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest, filter, identity, Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'asset-sg-redirect-to-lang',
  template: '<asset-sg-not-found *ngIf="isNotFound" />',
  standalone: false,
})
export class RedirectToLangComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);

  isNotFound = false;

  private readonly subscription: Subscription;

  constructor(router: Router, authService: AuthService) {
    const isAuthenticated$ = authService.isInitialized$.pipe(filter(identity));
    this.subscription = combineLatest([this.route.url, isAuthenticated$]).subscribe(([url]) => {
      if (url.length !== 0 && (supportedLangs as readonly string[]).includes(url[0].path)) {
        this.isNotFound = true;
        return;
      }
      const newUrl = url.map((it) => it.path) as Array<string | UrlSegment>;
      newUrl.splice(0, 0, 'de');
      router.navigate(newUrl, { queryParamsHandling: 'merge' }).then();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
