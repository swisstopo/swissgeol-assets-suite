import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom, map, Observable, startWith } from 'rxjs';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  setFiltersState,
  updateSearchQuery,
  PanelState,
} from '../../../../../../libs/asset-viewer/src/lib/state/asset-search/asset-search.actions';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  selectActiveFilters,
  selectIsFiltersOpen,
} from '../../../../../../libs/asset-viewer/src/lib/state/asset-search/asset-search.selector';

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

  readonly activeFilterCount$ = this.store
    .select(selectActiveFilters)
    .pipe(map((filters) => (filters.length > 0 ? filters.length : null)));

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

  async toggleAssetDrawer(): Promise<void> {
    const isOpen = await firstValueFrom(this.store.select(selectIsFiltersOpen));
    if (isOpen) {
      this.store.dispatch(setFiltersState({ state: PanelState.ClosedManually }));
    } else {
      this.store.dispatch(setFiltersState({ state: PanelState.OpenedManually }));
    }
  }

  goToViewer({ favoritesOnly }: { favoritesOnly: boolean }): void {
    const basePath = `/${this.translateService.currentLang}`;
    const favoritesPath = `${basePath}/favorites`;

    const [sourcePath, targetPath] = favoritesOnly ? [basePath, favoritesPath] : [favoritesPath, basePath];

    const currentPath = this.router.url.split('?', 2)[0];
    if (currentPath === sourcePath) {
      this.store.dispatch(updateSearchQuery({ query: { favoritesOnly } }));
    } else {
      this.router.navigateByUrl(targetPath).then();
    }
  }

  protected readonly AssetEditPolicy = AssetEditPolicy;
}

type MenuItem = 'home' | 'favorites' | 'create-asset' | 'options';
