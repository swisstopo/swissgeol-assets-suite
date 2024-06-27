import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminService, User, Workgroup } from '../../services/admin.service';

@Component({
  selector: 'asset-sg-workgroups',
  templateUrl: './workgroups.component.html',
  styleUrls: ['./workgroups.component.scss'],
})
export class WorkgroupsComponent implements OnInit, OnDestroy {
  public users: User[] = [];
  public workgroups: Workgroup[] = [];
  public mode: 'edit' | 'create' | undefined = undefined;
  public selectedWorkgroup: Workgroup | null = null;
  protected readonly COLUMNS = ['name', 'status', 'users', 'actions'];

  private _adminService = inject(AdminService);
  private subscriptions: Subscription = new Subscription();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public selectWorkgroup(workgroup: Workgroup): void {
    console.log('here');
    this.selectedWorkgroup = workgroup;
  }

  public createWorkgroup(): void {
    this.mode = 'create';
  }

  public deactivateWorkgroup(workgroup: Workgroup): void {
    const { id, ...disabledWorkgroup } = { ...workgroup, disabled_at: new Date() };
    this._adminService.updateWorkgroups(id, disabledWorkgroup).subscribe();
  }

  private initSubscriptions(): void {
    this.subscriptions.add(
      this._adminService.getUsersNew().subscribe((users) => {
        this.users = users;
      })
    );
    this.subscriptions.add(
      this._adminService.getWorkgroups().subscribe((workgroups) => {
        this.workgroups = workgroups;
      })
    );
  }
}
