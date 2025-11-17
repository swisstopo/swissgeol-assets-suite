import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDivider } from '@angular/material/divider';
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
import { RouterModule, Routes } from '@angular/router';
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
  ReferencePipe,
  SmartTranslatePipe,
  StatusChipComponent,
  ZoomControlsComponent,
} from '@asset-sg/client-shared';
import { FavoritesModule } from '@asset-sg/favorites';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxPush } from '@rx-angular/template/push';
import { SgcButton, SgcCard, SgcIcon } from '@swissgeol/ui-core-angular';
import { de } from 'date-fns/locale/de';

import { AssetPickerComponent } from './components/asset-picker';
import { AssetSearchDetailComponent } from './components/asset-search-detail';
import { AssetSearchFilterComponent } from './components/asset-search-filter/asset-search-filter.component';
import { AssetSearchRefineComponent } from './components/asset-search-refine';
import { AssetSearchResultsComponent } from './components/asset-search-results';
import { AssetViewerFilesContentComponent } from './components/asset-viewer-files/asset-viewer-files-content/asset-viewer-files-content.component';
import { AssetViewerFilesContentSummaryComponent } from './components/asset-viewer-files/asset-viewer-files-content-summary/asset-viewer-files-content-summary.component';
import { FilePagePipe } from './components/asset-viewer-files/asset-viewer-files-content-summary/file-page.pipe';
import { AssetViewerFilesTagComponent } from './components/asset-viewer-files/asset-viewer-files-tag/asset-viewer-files-tag.component';
import { AssetViewerFilesComponent } from './components/asset-viewer-files/asset-viewer-files.component';
import { FileSizePipe } from './components/asset-viewer-files/file-size.pipe';
import { AssetViewerPageComponent } from './components/asset-viewer-page';
import { MapComponent } from './components/map/map.component';
import { MapControlsComponent } from './components/map-controls/map-controls.component';
import { MapLegendComponent } from './components/map-legend/map-legend.component';
import { ViewerParamsService } from './services/viewer-params.service';
import { assetSearchReducer } from './state/asset-search/asset-search.reducer';
import { mapControlReducer } from './state/map-control/map-control.reducer';

const routes: Routes = [
  {
    path: '',
    component: AssetViewerPageComponent,
  },
];

@NgModule({
  declarations: [
    AssetViewerPageComponent,
    AssetViewerFilesContentComponent,
    AssetViewerFilesContentSummaryComponent,
    AssetViewerFilesTagComponent,
    MapComponent,
    MapControlsComponent,
    AssetSearchDetailComponent,
    AssetSearchRefineComponent,
    AssetSearchFilterComponent,
    AssetSearchResultsComponent,
    AssetViewerFilesComponent,
    AssetPickerComponent,
    FilePagePipe,
    FileSizePipe,
  ],
  imports: [
    CommonModule,
    FavoritesModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    StoreModule.forFeature('assetSearch', assetSearchReducer),
    StoreModule.forFeature('mapControl', mapControlReducer),
    ReactiveFormsModule,

    SvgIconComponent,
    DatePipe,
    ZoomControlsComponent,

    RxFor,
    RxLet,
    RxPush,

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
    ReferencePipe,
    MatDivider,
    StatusChipComponent,
    SgcCard,
    SgcIcon,
    SgcButton,
    CdkAccordion,
    CdkAccordionItem,
    MatChip,
    MatButton,
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
