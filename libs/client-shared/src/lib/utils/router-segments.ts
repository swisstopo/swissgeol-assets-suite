import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router, UrlSegment } from '@angular/router';
import { filter, map, Observable, shareReplay, startWith } from 'rxjs';

export const ROUTER_SEGMENTS = new InjectionToken<Observable<UrlSegment[]>>('@asset-sg/client-shared/router-segments');

export function routerSegmentsFactory(): Observable<UrlSegment[]> {
  const router = inject(Router);
  return router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(
      (event) =>
        (router.getCurrentNavigation() ?? router.lastSuccessfulNavigation)?.finalUrl?.root.children?.['primary']
          ?.segments ?? event.urlAfterRedirects.split('/').map((it) => new UrlSegment(it, {})),
    ),
    shareReplay(1),
    startWith([]),
  );
}
