import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from './components/admin-page';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UsersComponent } from './components/users/users.component';
import { WorkgroupEditComponent } from './components/workgroup-edit/workgroup-edit.component';
import { WorkgroupsComponent } from './components/workgroups/workgroups.component';

const routes: Routes = [
  {
    path: '',
    component: AdminPageComponent,
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'workgroups',
        component: WorkgroupsComponent,
      },
      {
        path: 'workgroups/new',
        component: WorkgroupEditComponent,
      },
      {
        path: 'users/:id',
        component: UserEditComponent,
      },
      {
        path: 'workgroups/:id',
        component: WorkgroupEditComponent,
      },
      {
        pathMatch: 'full',
        path: '',
        redirectTo: 'users',
      },
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule {}
