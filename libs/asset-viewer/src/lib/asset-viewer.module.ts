import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { RouterModule } from '@angular/router';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { de } from 'date-fns/locale/de';

import {
  AnchorComponent,
  AnimateNumberComponent,
  ButtonComponent,
  DatePipe,
  DatepickerToggleIconComponent,
  DragHandleComponent,
  DrawerComponent,
  DrawerPanelComponent,
  IsEditorPipe,
  ValueItemDescriptionPipe,
  ValueItemNamePipe,
  ZoomControlsComponent,
} from '@asset-sg/client-shared';

import { AssetPickerComponent } from './components/asset-picker';
import { AssetSearchDetailComponent } from './components/asset-search-detail';
import { AssetSearchRefineComponent } from './components/asset-search-refine';
import { AssetSearchResultsComponent } from './components/asset-search-results';
import {
  AssetSearchResultComponent,
} from './components/asset-search-results/asset-search-result/asset-search-result.component';
import { AssetViewerPageComponent } from './components/asset-viewer-page';
import { MapComponent } from './components/map';
import { AssetSearchEffects } from './state/asset-search/asset-search.effects';
import { assetSearchReducer } from './state/asset-search/asset-search.reducer';

@NgModule({
  declarations: [
    AssetViewerPageComponent,
    MapComponent,
    AssetSearchDetailComponent,
    AssetSearchRefineComponent,
    AssetSearchResultsComponent,
    AssetPickerComponent,
    AssetSearchResultComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: AssetViewerPageComponent,
      },
    ]),
    TranslateModule.forChild(),
    StoreModule.forFeature('assetSearch', assetSearchReducer),
    EffectsModule.forFeature(AssetSearchEffects),
    ReactiveFormsModule,

    SvgIconComponent,
    ValueItemNamePipe,
    ValueItemDescriptionPipe,
    DatePipe,
    ZoomControlsComponent,
    IsEditorPipe,
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
  ],
  providers: [
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
export class AssetViewerModule {
}
