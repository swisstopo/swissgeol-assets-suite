import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { UserOnWorkgroup, Workgroup } from '../../services/admin.service';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-workgroups',
  templateUrl: './workgroups.component.html',
  styleUrls: ['./workgroups.component.scss'],
})
export class WorkgroupsComponent implements OnInit, OnDestroy {
  public users: UserOnWorkgroup[] = [];
  public workgroups: Workgroup[] = [];

  protected readonly COLUMNS = ['name', 'users', 'status', 'actions'];

  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly users$ = this.store.select(selectUsers);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initSubscriptions(): void {
    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        this.workgroups = workgroups;
      })
    );
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.users = users.map((user) => ({ role: user.role, user: { email: user.email, id: user.id } }));
      })
    );
  }
}
