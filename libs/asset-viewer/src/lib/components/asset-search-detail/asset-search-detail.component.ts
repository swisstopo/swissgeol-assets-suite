import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { appSharedStateActions, can$, fromAppShared, LanguageService } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { AssetContactRole, AssetEditPolicy, AssetFile, AssetId, Contact, LinkedAsset } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { filter, map, Observable, shareReplay, withLatestFrom } from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';

@Component({
  selector: 'asset-sg-asset-search-detail',
  templateUrl: './asset-search-detail.component.html',
  styleUrls: ['./asset-search-detail.component.scss'],
  standalone: false,
})
export class AssetSearchDetailComponent {
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly languageService = inject(LanguageService);
  protected readonly language$ = this.languageService.language$;
  protected readonly asset$ = this.store.select(fromAppShared.selectCurrentAsset);
  protected readonly isAnonymous$ = this.store.select(fromAppShared.selectIsAnonymousMode);

  public readonly contacts$: Observable<{ [K in AssetContactRole]: Array<Contact> }> = this.asset$.pipe(
    filter(isNotNull),
    withLatestFrom(this.store.select(fromAppShared.selectReferenceContacts).pipe(filter(isNotNull))),
    map(([asset, contacts]) =>
      [...asset.contacts.values()].reduce(
        (acc, { id, role }) => {
          const contact = contacts.get(id);
          if (contact !== undefined) {
            acc[role].push(contact);
          }
          return acc;
        },
        { [AssetContactRole.Author]: [], [AssetContactRole.Initiator]: [], [AssetContactRole.Supplier]: [] } as {
          [K in AssetContactRole]: Array<Contact>;
        },
      ),
    ),
  );

  public readonly linkedAssets$ = this.asset$.pipe(
    filter(isNotNull),
    map((asset) => {
      const links: LinkedAsset[] = [];
      if (asset.parent) {
        links.push(asset.parent);
      }
      links.push(...asset.siblings);
      return links;
    }),
  );

  public readonly canUpdate$ = can$(AssetEditPolicy, this.asset$, (it, asset) => it.canUpdate(asset));

  private readonly filesSplitByType$ = this.asset$.pipe(
    map((asset) => {
      const mapping: [AssetFile[], AssetFile[]] = [[], []];
      if (asset == null) {
        return mapping;
      }
      for (const file of asset.files) {
        mapping[file.legalDocCode === null ? 0 : 1].push(file);
      }
      return mapping;
    }),
    shareReplay(1),
  );

  public readonly normalFiles$ = this.filesSplitByType$.pipe(map(([files]) => files));
  public readonly legalFiles$ = this.filesSplitByType$.pipe(map(([_, files]) => files));

  private readonly router = inject(Router);
  private readonly viewerControllerService = inject(ViewerControllerService);

  public navigateToEdit(lang: string | null, assetId: AssetId) {
    this.router.navigate([lang, 'asset-admin', assetId]).then();
  }

  public clearSelectedAsset() {
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: null }));
  }

  public selectAsset(assetId: number) {
    this.viewerControllerService.selectAsset(assetId);
  }
}
