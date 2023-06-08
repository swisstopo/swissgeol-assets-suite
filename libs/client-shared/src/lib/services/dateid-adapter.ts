import { Inject, Injectable, Optional } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import type { Locale } from 'date-fns';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { DateId, dateFromDateId, dateIdFromDate } from '@asset-sg/shared';

@Injectable()
export class DateIdAdapter extends DateAdapter<DateId, never> {
    private dateFnsAdaptor = new DateFnsAdapter(this.locale);

    constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: Locale) {
        super();
        this.dateFnsAdaptor.setLocale(matDateLocale);
    }

    getYear(dateId: DateId): number {
        return this.dateFnsAdaptor.getYear(dateFromDateId(dateId));
    }

    getMonth(dateId: DateId): number {
        return this.dateFnsAdaptor.getMonth(dateFromDateId(dateId));
    }

    getDate(dateId: DateId): number {
        return this.dateFnsAdaptor.getDate(dateFromDateId(dateId));
    }

    getDayOfWeek(dateId: DateId): number {
        return this.dateFnsAdaptor.getDayOfWeek(dateFromDateId(dateId));
    }

    getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return this.dateFnsAdaptor.getMonthNames(style);
    }

    getDateNames(): string[] {
        return this.dateFnsAdaptor.getDateNames();
    }

    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        return this.dateFnsAdaptor.getDayOfWeekNames(style);
    }

    getYearName(dateId: DateId): string {
        return this.dateFnsAdaptor.getYearName(dateFromDateId(dateId));
    }

    getFirstDayOfWeek(): number {
        return this.dateFnsAdaptor.getFirstDayOfWeek();
    }

    getNumDaysInMonth(dateId: DateId): number {
        return this.dateFnsAdaptor.getNumDaysInMonth(dateFromDateId(dateId));
    }

    clone(dateId: DateId): DateId {
        return dateId;
    }

    createDate(year: number, month: number, date: number): DateId {
        return dateIdFromDate(this.dateFnsAdaptor.createDate(year, month, date));
    }

    today(): DateId {
        return dateIdFromDate(this.dateFnsAdaptor.today());
    }

    parse(value: unknown, parseFormat: string | string[]): DateId | null {
        const date = this.dateFnsAdaptor.parse(value, parseFormat);
        return date && this.dateFnsAdaptor.isValid(date) ? dateIdFromDate(date) : this.invalid();
    }

    format(dateId: DateId, displayFormat: string): string {
        return this.dateFnsAdaptor.format(dateFromDateId(dateId), displayFormat);
    }

    addCalendarYears(date: DateId, years: number): DateId {
        return dateIdFromDate(this.dateFnsAdaptor.addCalendarYears(dateFromDateId(date), years));
    }

    addCalendarMonths(date: DateId, months: number): DateId {
        return dateIdFromDate(this.dateFnsAdaptor.addCalendarMonths(dateFromDateId(date), months));
    }

    addCalendarDays(date: DateId, days: number): DateId {
        return dateIdFromDate(this.dateFnsAdaptor.addCalendarDays(dateFromDateId(date), days));
    }

    toIso8601(dateId: DateId): string {
        return this.dateFnsAdaptor.toIso8601(dateFromDateId(dateId));
    }

    isDateInstance(obj: unknown): boolean {
        return pipe(
            DateId.decode(obj),
            E.map(dateFromDateId),
            E.map(d => this.dateFnsAdaptor.isDateInstance(d)),
            E.getOrElse(() => this.invalid() === obj),
        );
    }

    isValid(dateId: DateId): boolean {
        return dateId === this.invalid() ? false : this.dateFnsAdaptor.isValid(dateFromDateId(dateId));
    }

    invalid(): DateId {
        return -1 as DateId;
    }
}
