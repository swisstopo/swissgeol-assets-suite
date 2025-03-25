import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, Observable, startWith } from 'rxjs';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { setFiltersOpen } from '../../../../../../libs/asset-viewer/src/lib/state/asset-search/asset-search.actions';
import { AppState } from '../../state/app-state';

@UntilDestroy()
@Component({
  selector: 'asset-sg-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenuBarComponent {
  @HostBinding('attr.role')
  readonly role = 'navigation';

  private readonly router = inject(Router);
  private readonly store = inject(Store<AppState>);

  readonly translateService = inject(TranslateService);

  readonly userExists$ = this.store.select(fromAppShared.selectIsAnonymousMode).pipe(map((anonymous) => !anonymous));

  readonly activeItem$: Observable<MenuItem | null> = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(() => undefined),
    map((): MenuItem | null => {
      const segments = (this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation)?.finalUrl?.root
        .children?.['primary']?.segments;
      if (segments == null || segments.length === 1) {
        return 'home';
      }
      const path = segments.slice(1).join('/');
      const isPath = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

      if (isPath('asset-admin/new')) {
        return 'create-asset';
      }
      if (isPath('favorites')) {
        return 'favorites';
      }
      if (path == 'asset-admin' || isPath('admin')) {
        return 'options';
      }
      return null;
    }),
    startWith('home' as const)
  );

  toggleAssetDrawer(): void {
    this.store.dispatch(setFiltersOpen({ isOpen: 'toggle' }));
  }

  protected readonly AssetEditPolicy = AssetEditPolicy;
}

type MenuItem = 'home' | 'favorites' | 'create-asset' | 'options';
