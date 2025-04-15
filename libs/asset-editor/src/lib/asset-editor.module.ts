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
  fromAppShared,
  MatDateIdModule,
  PageHeaderComponent,
  ValueItemDescriptionPipe,
  ValueItemNamePipe,
  ViewChildMarker,
} from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { de } from 'date-fns/locale/de';
import { combineLatest, filter, map } from 'rxjs';
import { AssetEditorIdFormComponent } from './components/asset-editor-id-form/asset-editor-id-form.component';
import { AssetEditorIdListComponent } from './components/asset-editor-id-list/asset-editor-id-list.component';
import { AssetEditorLaunchComponent } from './components/asset-editor-launch/asset-editor-launch.component';
import { AssetEditorNavigationComponent } from './components/asset-editor-navigation/asset-editor-navigation.component';
import { AssetEditorPageComponent } from './components/asset-editor-page/asset-editor-page.component';
import { AssetEditorSaveComponent } from './components/asset-editor-save/asset-editor-save.component';
import { AssetEditorSyncComponent } from './components/asset-editor-sync/asset-editor-sync.component';
import { AssetEditorTabAdministrationComponent } from './components/asset-editor-tab-administration/asset-editor-tab-administration.component';
import { ReplaceBrPipe } from './components/asset-editor-tab-administration/replace-br.pipe';
import { AssetEditorTabContactsComponent } from './components/asset-editor-tab-contacts/asset-editor-tab-contacts.component';
import { AssetEditorTabFilesComponent } from './components/asset-editor-tab-files/asset-editor-tab-files.component';
import { AssetEditorTabGeneralComponent } from './components/asset-editor-tab-general/asset-editor-tab-general.component';
import { AssetEditorTabGeometriesComponent } from './components/asset-editor-tab-geometries/asset-editor-tab-geometries.component';
import { AssetEditorTabReferencesComponent } from './components/asset-editor-tab-references/asset-editor-tab-references.component';
import { AssetEditorTabUsageComponent } from './components/asset-editor-tab-usage/asset-editor-tab-usage.component';
import { AssetEditorFilesComponent } from './components/asset-editor-tabs/asset-editor-files/asset-editor-files.component';
import { AssetEditorGeneralComponent } from './components/asset-editor-tabs/asset-editor-general/asset-editor-general.component';
import { AssetEditorStatusAssigneeComponent } from './components/asset-editor-tabs/asset-editor-status/asset-editor-status-assignee/asset-editor-status-assignee.component';
import { AssetEditorStatusContentComponent } from './components/asset-editor-tabs/asset-editor-status/asset-editor-status-content/asset-editor-status-content.component';
import { AssetEditorStatusStepComponent } from './components/asset-editor-tabs/asset-editor-status/asset-editor-status-step/asset-editor-status-step.component';
import { AssetEditorStatusStepsComponent } from './components/asset-editor-tabs/asset-editor-status/asset-editor-status-steps/asset-editor-status-steps.component';
import { AssetEditorStatusComponent } from './components/asset-editor-tabs/asset-editor-status/asset-editor-status.component';
import { AssetMultiselectComponent } from './components/asset-multiselect/asset-multiselect.component';
import { Lv95xWithoutPrefixPipe, Lv95yWithoutPrefixPipe } from './components/lv95-without-prefix';
import { AssetEditorEffects } from './state/asset-editor.effects';

export const canLeaveEdit: CanDeactivateFn<AssetEditorPageComponent> = (component, _ars, _crss, target) =>
  component.canDeactivate(target);

@NgModule({
  declarations: [
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
    AssetEditorTabReferencesComponent,
    AssetEditorTabUsageComponent,
    AssetEditorGeneralComponent,
    AssetEditorFilesComponent,
    AssetEditorStatusComponent,
    AssetEditorStatusAssigneeComponent,
    AssetEditorStatusContentComponent,
    AssetEditorStatusStepComponent,
    AssetEditorStatusStepsComponent,
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
              map((user) => user.isAdmin),
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
              store.select(fromAppShared.selectCurrentAsset),
              store.select(fromAppShared.selectUser).pipe(filter(isNotNull)),
            ]).pipe(
              map(([assetEditDetail, user]) => {
                const policy = new AssetEditPolicy(user);
                return assetEditDetail == null ? policy.canCreate() : policy.canUpdate(assetEditDetail);
              }),
            );
          }) as CanActivateFn,
        ],
      },
    ]),
    TranslateModule.forChild(),
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
