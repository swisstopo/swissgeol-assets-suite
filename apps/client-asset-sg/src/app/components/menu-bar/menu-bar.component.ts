import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import queryString from 'query-string';
import { filter, map, shareReplay } from 'rxjs';

import { AppState } from '../../state/app-state';

@UntilDestroy()
@Component({
  selector: 'asset-sg-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent {
  @HostBinding('attr.role') role = 'navigation';
  private _router = inject(Router);
  public _translateService = inject(TranslateService);
  private _store = inject(Store<AppState>);

  public isAnonymousMode$ = this._store.select(fromAppShared.selectIsAnonymousMode);
  public isAssetsActive$ = this.createIsRouteActive$((url) => Boolean(url.match(/^\/\w\w$/)));
  public isEditActive$ = this.isSegmentActive('asset-admin');
  public isFavouritesActive$ = this.isSegmentActive('favourites');
  public isAdminActive$ = this.isSegmentActive('admin');
  public isProfileActive$ = this.isSegmentActive('profile');

  private createIsRouteActive$(fn: (url: string) => boolean) {
    const o$ = this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        const { url } = queryString.parseUrl(this._router.url);
        return fn(url);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    o$.pipe(untilDestroyed(this)).subscribe();
    return o$;
  }

  private isSegmentActive(segment: string) {
    return this.createIsRouteActive$((url) => {
      return Boolean(url.match(`^/\\w\\w/${segment}`));
    });
  }

  public openAssetDrawer() {
    this._store.dispatch(appSharedStateActions.toggleSearchFilter());
  }

  protected readonly AssetEditPolicy = AssetEditPolicy;
}
