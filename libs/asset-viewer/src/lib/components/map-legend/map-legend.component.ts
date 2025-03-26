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
import { defaultLayerType, LayerType, mapLayers } from '../../shared/map-layer-styles/map-layers';
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
  private activeSyle: LayerType = defaultLayerType;
  private mapLayersKeys = Object.keys(mapLayers) as LayerType[];
  private activeStyleSubject = new BehaviorSubject(mapLayers[this.activeSyle]);
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
    const currentIndex = this.mapLayersKeys.indexOf(this.activeSyle);
    const nextIndex = (currentIndex + 1) % this.mapLayersKeys.length;
    this.activeSyle = this.mapLayersKeys[nextIndex];
    this.activeStyleSubject.next(mapLayers[this.activeSyle]);
    this.changeStyle.emit(mapLayers[this.activeSyle].styleFunction);
  }
}
