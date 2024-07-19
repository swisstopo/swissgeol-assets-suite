import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { inject, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CanActivateFn, CanDeactivateFn, RouterModule } from '@angular/router';
import {
  AnchorComponent,
  ButtonComponent,
  DatePipe,
  DateTimePipe,
  DatepickerToggleIconComponent,
  DrawerComponent,
  DrawerPanelComponent,
  MatDateIdModule,
  ValueItemDescriptionPipe,
  ValueItemNamePipe,
  ViewChildMarker,
  fromAppShared,
  AdminOnlyDirective,
} from '@asset-sg/client-shared';
import { isNotNull, ORD } from '@asset-sg/core';
import * as RD from '@devexperts/remote-data-ts';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { AssetEditPolicy } from '@shared/policies/asset-edit.policy';
import { de } from 'date-fns/locale/de';

import * as O from 'fp-ts/Option';
import { combineLatest, filter, map, tap, withLatestFrom } from 'rxjs';
import { AssetEditorLaunchComponent } from './components/asset-editor-launch';
import { AssetEditorPageComponent } from './components/asset-editor-page';
import { AssetEditorSyncComponent } from './components/asset-editor-sync/asset-editor-sync.component';
import { AssetEditorTabAdministrationComponent, ReplaceBrPipe } from './components/asset-editor-tab-administration';
import { AssetEditorTabContactsComponent } from './components/asset-editor-tab-contacts';
import { AssetEditorTabGeneralComponent } from './components/asset-editor-tab-general';
import { AssetEditorTabGeometriesComponent } from './components/asset-editor-tab-geometries';
import { AssetEditorTabPageComponent } from './components/asset-editor-tab-page';
import { AssetEditorTabReferencesComponent } from './components/asset-editor-tab-references';
import { AssetEditorTabUsageComponent } from './components/asset-editor-tab-usage';
import { AssetMultiselectComponent } from './components/asset-multiselect';
import { Lv95xWithoutPrefixPipe, Lv95yWithoutPrefixPipe } from './components/lv95-without-prefix';
import { AssetEditorEffects } from './state/asset-editor.effects';
import { assetEditorReducer } from './state/asset-editor.reducer';
import * as fromAssetEditor from './state/asset-editor.selectors';

export const canLeaveEdit: CanDeactivateFn<AssetEditorPageComponent> = (c) => c.canLeave();

@NgModule({
  declarations: [
    AssetEditorLaunchComponent,
    AssetEditorSyncComponent,
    AssetEditorPageComponent,
    AssetEditorTabAdministrationComponent,
    AssetEditorTabContactsComponent,
    AssetEditorTabGeneralComponent,
    AssetEditorTabGeometriesComponent,
    AssetEditorTabPageComponent,
    AssetEditorTabReferencesComponent,
    AssetEditorTabUsageComponent,
    Lv95xWithoutPrefixPipe,
    Lv95yWithoutPrefixPipe,
    ReplaceBrPipe,
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
              map((user) => {
                const policy = new AssetEditPolicy(user);
                return policy.canDoEverything() || policy.canCreate();
              })
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
              store
                .select(fromAssetEditor.selectRDAssetEditDetail)
                .pipe(map(RD.toNullable), filter(isNotNull), map(O.toNullable)),
              store.select(fromAppShared.selectUser).pipe(filter(isNotNull)),
            ]).pipe(
              map(([assetEditDetail, user]) => {
                console.log('hello?');
                const policy = new AssetEditPolicy(user);
                return (
                  policy.canDoEverything() ||
                  (assetEditDetail == null ? policy.canCreate() : policy.canUpdate(assetEditDetail))
                );
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
