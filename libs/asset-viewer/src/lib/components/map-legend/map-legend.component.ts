import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ButtonComponent, SmartTranslatePipe } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { StyleFunction } from 'ol/style/Style';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { mapLayers } from '../../shared/map-layer-styles/map-layers';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import { selectHasNoActiveFilters } from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-map-legend',
  imports: [
    CdkAccordion,
    CdkAccordionItem,
    SvgIconComponent,
    ButtonComponent,
    AsyncPipe,
    TranslateModule,
    SmartTranslatePipe,
  ],
  templateUrl: './map-legend.component.html',
  styleUrl: './map-legend.component.scss',
})
export class MapLegendComponent implements OnInit, OnDestroy {
  @Output() public readonly changeStyle = new EventEmitter<StyleFunction>();
  protected hasNoActiveFilters?: boolean;
  private activeStyleIndex = 0;
  private activeStyleSubject = new BehaviorSubject(mapLayers[this.activeStyleIndex]);
  protected activeStyle$ = this.activeStyleSubject.asObservable();
  private hasNoActiveFilters$ = this.store.select(selectHasNoActiveFilters);
  private subscriptions = new Subscription();

  constructor(private readonly store: Store<AppStateWithAssetSearch>) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.hasNoActiveFilters$.subscribe((hasNoActiveFilters) => {
        this.hasNoActiveFilters = hasNoActiveFilters;
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected handleChange() {
    // todo assets-300, assets-420: handle change
    this.activeStyleIndex = (this.activeStyleIndex + 1) % mapLayers.length;
    this.activeStyleSubject.next(mapLayers[this.activeStyleIndex]);
    this.changeStyle.emit(mapLayers[this.activeStyleIndex].styleFunction);
  }
}
