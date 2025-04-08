import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RoutingService } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/Option';
import { map, Subscription, take } from 'rxjs';
import { AssetEditDetailVM } from '../../models';
import * as actions from '../../state/asset-editor.actions';
import { AppStateWithAssetEditor } from '../../state/asset-editor.reducer';
import * as fromAssetEditor from '../../state/asset-editor.selectors';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-page',
  templateUrl: './asset-editor-page.component.html',
  styleUrls: ['./asset-editor-page.component.scss'],
  standalone: false,
})
export class AssetEditorPageComponent implements OnInit, OnDestroy {
  public assetId = 'new';
  public asset: AssetEditDetailVM | null = null;
  public form?: FormGroup;
  private readonly store = inject(Store<AppStateWithAssetEditor>);
  private readonly route = inject(ActivatedRoute);
  private readonly routingService = inject(RoutingService);
  private readonly fb = inject(FormBuilder);

  public assetEditDetail$ = this.store.select(fromAssetEditor.selectRDAssetEditDetail).pipe(ORD.fromFilteredSuccess);

  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.loadAssetFromRouteParams();
    // TODO: fix with new endpoints/ data schema for asset
    this.subscriptions.add(
      this.assetEditDetail$
        .pipe(map((res) => (O.isSome(res) ? res.value : null)))
        .subscribe((assetDetail) => (this.asset = assetDetail))
    );
    this.form = this.fb.group({
      general: this.fb.group({}),
      contacts: this.fb.group({}),
      references: this.fb.group({}),
      geometries: this.fb.group({}),
      altdaten: this.fb.group({}),
      status: this.fb.group({}),
    });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public navigateToStart() {
    this.routingService.navigateBack(['/']).then();
  }

  private loadAssetFromRouteParams() {
    this.subscriptions.add(
      this.route.paramMap.pipe(take(1)).subscribe((params: ParamMap) => {
        const assetId = params.get('assetId');
        if (assetId) {
          this.assetId = assetId;
          this.store.dispatch(actions.loadAsset({ assetId: parseInt(assetId) }));
        }
      })
    );
  }
}
