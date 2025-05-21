import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router, UrlSegment } from '@angular/router';
import { filter, map, Observable, startWith } from 'rxjs';

export const ROUTER_SEGMENTS = new InjectionToken<Observable<UrlSegment[] | undefined>>(
  '@asset-sg/client-shared/router-segments',
);

export function routerSegmentsFactory(): Observable<UrlSegment[] | undefined> {
  const router = inject(Router);
  return router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(() => undefined),
    map(() => {
      return (router.getCurrentNavigation() ?? router.lastSuccessfulNavigation)?.finalUrl?.root.children?.['primary']
        ?.segments;
    }),
  );
}
