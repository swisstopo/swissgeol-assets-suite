import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ButtonComponent } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { StyleFunction } from 'ol/style/Style';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  availableLayerStyles,
  defaultLayerStyle,
  LayerStyleIdentification,
} from '../../shared/map-configuration/map-layer-styles';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import { selectHasNoActiveFilters } from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-map-legend',
  imports: [CdkAccordion, CdkAccordionItem, SvgIconComponent, ButtonComponent, AsyncPipe, TranslateModule],
  templateUrl: './map-legend.component.html',
  styleUrl: './map-legend.component.scss',
})
export class MapLegendComponent implements OnInit, OnDestroy {
  @Output() public readonly changeStyle = new EventEmitter<StyleFunction>();
  protected hasNoActiveFilters?: boolean;
  private activeLayerStyle: LayerStyleIdentification = defaultLayerStyle;
  private readonly layerStyleKeys = Object.keys(availableLayerStyles) as LayerStyleIdentification[];
  private activeLayerStyleSubject = new BehaviorSubject(availableLayerStyles[this.activeLayerStyle]);
  protected activeLayerStyle$ = this.activeLayerStyleSubject.asObservable();
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
    const currentIndex = this.layerStyleKeys.indexOf(this.activeLayerStyle);
    const nextIndex = (currentIndex + 1) % this.layerStyleKeys.length;
    this.activeLayerStyle = this.layerStyleKeys[nextIndex];
    this.activeLayerStyleSubject.next(availableLayerStyles[this.activeLayerStyle]);
    this.changeStyle.emit(availableLayerStyles[this.activeLayerStyle].styleFunction);
  }
}
