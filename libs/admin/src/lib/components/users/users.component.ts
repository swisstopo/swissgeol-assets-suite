import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';
import { AdminService, User, Workgroup } from '../../services/admin.service';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  public users: User[] = [];
  public workgroups: Workgroup[] = [];
  public selectedUser?: User;
  public mode: 'edit' | 'create' | undefined = undefined;
  protected readonly COLUMNS = ['email', 'workgroups', 'isAdmin', 'languages', 'actions'];

  private _adminService = inject(AdminService);
  private subscriptions: Subscription = new Subscription();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public update(user: User, event: MatCheckboxChange) {
    this._adminService.updateUser({ ...user, isAdmin: event.checked }).subscribe();
  }

  public edit(user: User): void {
    this.selectedUser = user;
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

  protected readonly console = console;
}
