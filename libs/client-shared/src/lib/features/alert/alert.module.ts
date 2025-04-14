import { AsyncPipe, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { StoreModule } from '@ngrx/store';

import { ForModule } from '@rx-angular/template/for';
import { alertFeature, alertReducer } from '../../state/alert/alert.reducer';
import { AlertComponent } from './alert/alert.component';
import { AlertListComponent } from './alert-list/alert-list.component';

@NgModule({
  declarations: [AlertListComponent, AlertComponent],
  imports: [CommonModule, AsyncPipe, StoreModule.forFeature(alertFeature, alertReducer), SvgIconComponent, ForModule],
  exports: [AlertListComponent],
})
export class AlertModule {}
