import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ButtonComponent } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { StyleFunction } from 'ol/style/Style';
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
export class MapLegendComponent {
  @Output() public readonly changeStyle = new EventEmitter<StyleFunction>();

  private readonly store: Store<AppStateWithAssetSearch> = inject(Store);

  protected hasNoActiveFilters$ = this.store.select(selectHasNoActiveFilters);
  private activeLayerStyle: LayerStyleIdentification = defaultLayerStyle;
  private readonly layerStyleKeys = Object.keys(availableLayerStyles) as LayerStyleIdentification[];
  private readonly activeLayerStyleSubject = new BehaviorSubject(availableLayerStyles[this.activeLayerStyle]);
  protected activeLayerStyle$ = this.activeLayerStyleSubject.asObservable();

  protected handleChange() {
    const currentIndex = this.layerStyleKeys.indexOf(this.activeLayerStyle);
    const nextIndex = (currentIndex + 1) % this.layerStyleKeys.length;
    this.activeLayerStyle = this.layerStyleKeys[nextIndex];
    this.activeLayerStyleSubject.next(availableLayerStyles[this.activeLayerStyle]);
    this.changeStyle.emit(availableLayerStyles[this.activeLayerStyle].styleFunction);
  }
}
