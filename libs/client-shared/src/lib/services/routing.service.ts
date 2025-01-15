import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private canGoBack = false;

  constructor() {
    this.router.events
      .pipe(
        filter((it) => it instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        this.canGoBack = true;
      });
  }

  public navigateBack(fallback: string[]): void {
    if (this.canGoBack) {
      this.location.back();
    } else {
      this.router.navigate(fallback).then();
    }
  }
}
