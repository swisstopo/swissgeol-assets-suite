import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { appSharedStateActions, assetsPageMatcher, fromAppShared } from '@asset-sg/client-shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';

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

  public userExists$ = this._store.select(fromAppShared.selectIsAnonymousMode).pipe(map((anonymous) => !anonymous));
  public isAssetsActive$ = this._router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => {
      const segments = this._router.parseUrl(this._router.url).root.children['primary'].segments;
      return assetsPageMatcher(segments) !== null;
    })
  );

  public openAssetDrawer() {
    this._store.dispatch(appSharedStateActions.toggleSearchFilter());
  }

  protected readonly AssetEditPolicy = AssetEditPolicy;
}
