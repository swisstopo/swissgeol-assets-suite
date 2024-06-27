import { A11yModule } from '@angular/cdk/a11y';
import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
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
import { RouterModule } from '@angular/router';
import {
  AnchorComponent,
  ButtonComponent,
  DrawerComponent,
  DrawerPanelComponent,
  ViewChildMarker,
} from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';
import { AdminPageComponent } from './components/admin-page';
import { UserCollapsedComponent } from './components/user-collapsed';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserExpandedComponent } from './components/user-expanded';
import { UsersComponent } from './components/users/users.component';
import { WorkgroupEditComponent } from './components/workgroup-edit/workgroup-edit-component';
import { WorkgroupsComponent } from './components/workgroups/workgroups.component';

@NgModule({
  declarations: [
    AdminPageComponent,
    UserCollapsedComponent,
    UserExpandedComponent,
    WorkgroupsComponent,
    WorkgroupEditComponent,
    UsersComponent,
    UserEditComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: AdminPageComponent,
      },
    ]),
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
    ViewChildMarker,
    ButtonComponent,
    AnchorComponent,
    DrawerComponent,
    DrawerPanelComponent,
  ],
})
export class AdminModule {}
