import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
import { CanDeactivateFn, RouterModule } from '@angular/router';
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
    ButtonComponent,
    DatePipe,
    DateTimePipe,
    DatepickerToggleIconComponent,
    DrawerComponent,
    DrawerPanelComponent,
    IsNotMasterEditorPipe,
    MatDateIdModule,
    ValueItemDescriptionPipe,
    ValueItemNamePipe,
    ViewChildMarker,
} from '@asset-sg/client-shared';

import { AssetEditorLaunchComponent } from './components/asset-editor-launch';
import { AssetEditorPageComponent } from './components/asset-editor-page';
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

export const canLeaveEdit: CanDeactivateFn<AssetEditorPageComponent> = c => c.canLeave();

@NgModule({
    declarations: [
        AssetEditorLaunchComponent,
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
        IsNotMasterEditorPipe,

        MatAutocompleteModule,
        MatCheckboxModule,
        MatInputModule,
        MatDateIdModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSelectModule,
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
