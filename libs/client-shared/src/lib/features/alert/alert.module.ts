import { AsyncPipe, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { StoreModule } from '@ngrx/store';

import { AlertComponent } from './alert/alert.component';
import { AlertListComponent } from './alert-list/alert-list.component';
import { alertFeature, alertReducer } from './alert.reducer';


@NgModule({
  declarations: [
    AlertListComponent,
    AlertComponent,
  ],
  imports: [
    CommonModule,
    AsyncPipe,
    StoreModule.forFeature(alertFeature, alertReducer),
    SvgIconComponent,
  ],
  exports: [
    AlertListComponent,
  ],
})
export class AlertModule {}
