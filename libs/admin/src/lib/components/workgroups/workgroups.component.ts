import { KeyValue } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UserId, UserOnWorkgroup, Workgroup } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-workgroups',
  templateUrl: './workgroups.component.html',
  styleUrls: ['./workgroups.component.scss'],
})
export class WorkgroupsComponent {
  protected readonly COLUMNS = ['name', 'users', 'status', 'actions'];

  private readonly store = inject(Store<AppStateWithAdmin>);
  readonly workgroups$ = this.store.select(selectWorkgroups);

  getWorkgroupUsers(workgroup: Workgroup): Array<UserOnWorkgroup & { id: UserId }> {
    const result: Array<UserOnWorkgroup & { id: UserId }> = [];
    for (const [id, user] of workgroup.users) {
      result.push({ ...user, id });
    }
    return result;
  }
}
