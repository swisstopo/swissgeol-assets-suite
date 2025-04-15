import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCard } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSort, MatSortHeader } from '@angular/material/sort';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import {
  AnchorComponent,
  ButtonComponent,
  ChipComponent,
  DetailSectionComponent,
  DrawerComponent,
  DrawerPanelComponent,
  FilterSelectorComponent,
  PageHeaderComponent,
  SearchAndFilterComponent,
  SelectComponent,
  SmartTranslatePipe,
  TabComponent,
  TabsComponent,
  TextInputComponent,
  ToggleStatusComponent,
  ViewChildMarker,
} from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { IfModule } from '@rx-angular/template/if';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { AdminPageRoutingModule } from './admin-routing.module';
import { AddUsersToWorkgroupDialogComponent } from './components/add-users-to-workgroup-dialog/add-users-to-workgroup-dialog.component';
import { AddWorkgroupToUserDialogComponent } from './components/add-workgroup-to-user-dialog/add-workgroup-to-user-dialog.component';
import { AdminPageComponent } from './components/admin-page';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UsersComponent } from './components/users/users.component';
import { WorkgroupEditComponent } from './components/workgroup-edit/workgroup-edit.component';
import { WorkgroupsComponent } from './components/workgroups/workgroups.component';
import { CustomPaginatorIntl } from './services/custom-paginator-intl';
import { AdminEffects } from './state/admin.effects';
import { adminReducer } from './state/admin.reducer';

@NgModule({
  declarations: [
    AdminPageComponent,
    WorkgroupsComponent,
    WorkgroupEditComponent,
    UsersComponent,
    UserEditComponent,
    AddUsersToWorkgroupDialogComponent,
    AddWorkgroupToUserDialogComponent,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: CustomPaginatorIntl,
    },
    SmartTranslatePipe,
    TranslatePipe,
  ],
  imports: [
    CommonModule,
    AdminPageRoutingModule,
    StoreModule.forFeature('admin', adminReducer),
    EffectsModule.forFeature(AdminEffects),
    TranslateModule.forChild(),
    ReactiveFormsModule,

    LetModule,
    PushModule,
    ForModule,
    SvgIconComponent,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    DialogModule,
    A11yModule,
    MatProgressBarModule,

    MatTooltip,
    MatCheckbox,
    MatFormFieldModule,
    MatInputModule,
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
    MatTabsModule,
    ViewChildMarker,
    ButtonComponent,
    AnchorComponent,
    DrawerComponent,
    DrawerPanelComponent,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatAutocompleteModule,
    MatCard,
    MatSlideToggle,
    IfModule,
    MatPaginator,
    TextInputComponent,
    FilterSelectorComponent,
    MatChipSet,
    MatChip,
    MatSort,
    MatSortHeader,
    ChipComponent,
    DetailSectionComponent,
    SearchAndFilterComponent,
    ToggleStatusComponent,
    FormsModule,
    SelectComponent,
    PageHeaderComponent,
    TabsComponent,
    TabComponent,
  ],
})
export class AdminModule {}
