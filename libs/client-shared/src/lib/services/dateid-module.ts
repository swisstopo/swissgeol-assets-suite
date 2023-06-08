import { NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_DATE_FNS_FORMATS } from '@angular/material-date-fns-adapter';

import { DateIdAdapter } from './dateid-adapter';

@NgModule({
    providers: [
        {
            provide: DateAdapter,
            useClass: DateIdAdapter,
            deps: [MAT_DATE_LOCALE],
        },
    ],
})
export class DateIdModule {}

@NgModule({
    imports: [DateIdModule],
    providers: [{ provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS }],
})
export class MatDateIdModule {}
