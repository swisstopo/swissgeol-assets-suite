import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { AlertId } from '../../../state/alert/alert.model';
import { AlertEntry, AlertState } from '../../../state/alert/alert.reducer';
import { selectAlerts } from '../../../state/alert/alert.selectors';

@Component({
  selector: 'ul[app-alert-list]',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss'],
  standalone: false,
})
export class AlertListComponent {
  private readonly store = inject(Store<AlertState>);
  readonly alerts$ = this.store.select(selectAlerts);

  getAlertId = (_index: number, entry: AlertEntry): AlertId => entry.alert.id;
}
