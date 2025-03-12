import { Component, HostBinding, HostListener, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { AssetId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { actions, selectFavoriteAssetIds } from '../../state';

@Component({
  selector: 'button[asset-sg-favorite]',
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss'],
  standalone: false,
})
export class FavoriteButtonComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  assetId!: number;

  private readonly store = inject(Store);

  private assetIds = new Set<AssetId>();

  private readonly subscription = new Subscription();

  @HostBinding('class.is-active')
  get isActive(): boolean {
    return this.assetIds.has(this.assetId);
  }

  @HostListener('click')
  handleClick(): void {
    if (this.isActive) {
      this.store.dispatch(actions.remove({ assetId: this.assetId }));
    } else {
      this.store.dispatch(actions.add({ assetId: this.assetId }));
    }
  }

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(selectFavoriteAssetIds).subscribe((assetIds) => {
        this.assetIds = assetIds;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
