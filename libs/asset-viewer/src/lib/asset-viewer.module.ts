import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipSet } from '@angular/material/chips';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { RouterModule } from '@angular/router';
import {
  AnchorComponent,
  AnimateNumberComponent,
  ButtonComponent,
  ChipComponent,
  DatepickerToggleIconComponent,
  DatePipe,
  DragHandleComponent,
  DrawerComponent,
  DrawerPanelComponent,
  FileNamePipe,
  SmartTranslatePipe,
  ValueItemDescriptionPipe,
  ValueItemNamePipe,
  ZoomControlsComponent,
} from '@asset-sg/client-shared';
import { FavoritesModule } from '@asset-sg/favorites';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { de } from 'date-fns/locale/de';

import { AssetPickerComponent } from './components/asset-picker';
import { AssetSearchDetailComponent } from './components/asset-search-detail';
import { AssetSearchFilterComponent } from './components/asset-search-filter/asset-search-filter.component';
import { AssetSearchRefineComponent } from './components/asset-search-refine';
import { AssetSearchResultsComponent } from './components/asset-search-results';
import { AssetViewerFilesComponent } from './components/asset-viewer-files/asset-viewer-files.component';
import { FileMetadataPipe } from './components/asset-viewer-files/file-metadata.pipe';
import { AssetViewerPageComponent } from './components/asset-viewer-page';
import { MapComponent } from './components/map/map.component';
import { MapControlsComponent } from './components/map-controls/map-controls.component';
import { MapLegendComponent } from './components/map-legend/map-legend.component';
import { ViewerParamsService } from './services/viewer-params.service';
import { assetSearchReducer } from './state/asset-search/asset-search.reducer';
import { mapControlReducer } from './state/map-control/map-control.reducer';

@NgModule({
  declarations: [
    AssetViewerPageComponent,
    MapComponent,
    MapControlsComponent,
    AssetSearchDetailComponent,
    AssetSearchRefineComponent,
    AssetSearchFilterComponent,
    AssetSearchResultsComponent,
    AssetViewerFilesComponent,
    AssetPickerComponent,
    FileMetadataPipe,
  ],
  imports: [
    CommonModule,
    FavoritesModule,
    RouterModule.forChild([
      {
        path: '',
        component: AssetViewerPageComponent,
      },
    ]),
    TranslateModule.forChild(),
    StoreModule.forFeature('assetSearch', assetSearchReducer),
    StoreModule.forFeature('mapControl', mapControlReducer),
    ReactiveFormsModule,

    SvgIconComponent,
    ValueItemNamePipe,
    ValueItemDescriptionPipe,
    DatePipe,
    ZoomControlsComponent,
    ValueItemNamePipe,

    ForModule,
    LetModule,
    PushModule,

    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatDateFnsModule,
    MatInputModule,

    AnchorComponent,
    ButtonComponent,
    AnimateNumberComponent,
    DragHandleComponent,
    DrawerComponent,
    DrawerPanelComponent,
    DatepickerToggleIconComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    SmartTranslatePipe,
    CdkMonitorFocus,
    MatTooltip,
    MatChipSet,
    ChipComponent,
    MapLegendComponent,
    FileNamePipe,
  ],
  providers: [
    TranslatePipe,
    DecimalPipe,
    FileNamePipe,
    ViewerParamsService,
    { provide: MAT_DATE_LOCALE, useValue: de },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'yyyy-MM-dd',
        },
        display: {
          dateInput: 'yyyy-MM-dd',
          monthYearLabel: 'LLL uuuu',
          dateA11yLabel: 'PP',
          monthYearA11yLabel: 'LLLL uuuu',
        },
      },
    },
  ],
})
export class AssetViewerModule {}
