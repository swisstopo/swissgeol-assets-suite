import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { inject, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipSet } from '@angular/material/chips';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CanActivateFn, CanDeactivateFn, RouterModule } from '@angular/router';
import {
  AdminOnlyDirective,
  AnchorComponent,
  ButtonComponent,
  ChipComponent,
  DatepickerToggleIconComponent,
  DatePipe,
  DateTimePipe,
  DrawerComponent,
  DrawerPanelComponent,
  FileNamePipe,
  fromAppShared,
  MatDateIdModule,
  PageHeaderComponent,
  ValueItemDescriptionPipe,
  ValueItemNamePipe,
  ViewChildMarker,
} from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { de } from 'date-fns/locale/de';

import * as O from 'fp-ts/Option';
import { combineLatest, filter, map } from 'rxjs';
import { AssetEditorFilesComponent } from './components/asset-editor-files/asset-editor-files.component';
import { AssetEditorIdFormComponent } from './components/asset-editor-id-form/asset-editor-id-form.component';
import { AssetEditorIdListComponent } from './components/asset-editor-id-list/asset-editor-id-list.component';
import { AssetEditorLaunchComponent } from './components/asset-editor-launch';
import { AssetEditorNavigationComponent } from './components/asset-editor-navigation';
import { AssetEditorPageComponent } from './components/asset-editor-page';
import { AssetEditorSaveComponent } from './components/asset-editor-save';
import { AssetEditorSyncComponent } from './components/asset-editor-sync/asset-editor-sync.component';
import { AssetEditorTabAdministrationComponent, ReplaceBrPipe } from './components/asset-editor-tab-administration';
import { AssetEditorTabContactsComponent } from './components/asset-editor-tab-contacts';
import { AssetEditorTabFilesComponent } from './components/asset-editor-tab-files/asset-editor-tab-files.component';
import { AssetEditorTabGeneralComponent } from './components/asset-editor-tab-general';
import { AssetEditorTabGeometriesComponent } from './components/asset-editor-tab-geometries';
import { AssetEditorTabPageComponent } from './components/asset-editor-tab-page';
import { AssetEditorTabReferencesComponent } from './components/asset-editor-tab-references';
import { AssetEditorTabUsageComponent } from './components/asset-editor-tab-usage';
import { AssetMultiselectComponent } from './components/asset-multiselect';
import { Lv95xWithoutPrefixPipe, Lv95yWithoutPrefixPipe } from './components/lv95-without-prefix';
import { AssetEditorEffects } from './state/asset-editor.effects';
import { assetEditorReducer } from './state/asset-editor.reducer';
import { selectRDAssetEditDetail } from './state/asset-editor.selectors';

export const canLeaveEdit: CanDeactivateFn<AssetEditorPageComponent> = (c) => true;

@NgModule({
  declarations: [
    AssetEditorFilesComponent,
    AssetEditorIdFormComponent,
    AssetEditorIdListComponent,
    AssetEditorLaunchComponent,
    AssetEditorSyncComponent,
    AssetEditorPageComponent,
    AssetEditorTabAdministrationComponent,
    AssetEditorTabContactsComponent,
    AssetEditorTabFilesComponent,
    AssetEditorTabGeneralComponent,
    AssetEditorTabGeometriesComponent,
    AssetEditorTabPageComponent,
    AssetEditorTabReferencesComponent,
    AssetEditorTabUsageComponent,
    AssetEditorSaveComponent,
    Lv95xWithoutPrefixPipe,
    Lv95yWithoutPrefixPipe,
    ReplaceBrPipe,
    AssetEditorNavigationComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        component: AssetEditorLaunchComponent,

        // Only users that can create assets are permitted to see the asset admin page.
        canActivate: [
          (() => {
            const store = inject(Store);
            return store.select(fromAppShared.selectUser).pipe(
              filter(isNotNull),
              map((user) => user.isAdmin)
            );
          }) as CanActivateFn,
        ],
      },
      {
        path: ':assetId',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'general',
          },
          {
            path: ':tab',
            component: AssetEditorPageComponent,
            canDeactivate: [canLeaveEdit],
          },
        ],

        // Only users that can create new assets are permitted to access the new asset page.
        // Only users that can edit the selected asset are permitted to access the edit asset page.
        canActivate: [
          (() => {
            const store = inject(Store);
            return combineLatest([
              store.select(selectRDAssetEditDetail).pipe(map(RD.toNullable), filter(isNotNull), map(O.toNullable)),
              store.select(fromAppShared.selectUser).pipe(filter(isNotNull)),
            ]).pipe(
              map(([assetEditDetail, user]) => {
                const policy = new AssetEditPolicy(user);
                return assetEditDetail == null ? policy.canCreate() : policy.canUpdate(assetEditDetail);
              })
            );
          }) as CanActivateFn,
        ],
      },
    ]),
    TranslateModule.forChild(),
    StoreModule.forFeature('assetEditor', assetEditorReducer),
    EffectsModule.forFeature([AssetEditorEffects]),
    FormsModule,
    ReactiveFormsModule,
    A11yModule,

    LetModule,
    PushModule,
    ForModule,
    SvgIconComponent,
    DialogModule,
    A11yModule,
    AssetMultiselectComponent,

    ValueItemNamePipe,
    ValueItemDescriptionPipe,
    DatePipe,
    DateTimePipe,
    FileNamePipe,

    ViewChildMarker,
    ButtonComponent,
    AnchorComponent,
    DrawerComponent,
    DrawerPanelComponent,
    DatepickerToggleIconComponent,

    MatAutocompleteModule,
    MatCheckboxModule,
    MatInputModule,
    MatDateIdModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    AdminOnlyDirective,
    PageHeaderComponent,
    MatChipSet,
    ChipComponent,
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
export class AssetEditorModule {}
