import { ChangeDetectionStrategy, Component } from '@angular/core';

import { calendarIconPath } from '../../icons';

const template = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mat-datepicker-toggle-default-icon" fill="currentColor">${calendarIconPath}</svg>`;

@Component({
    standalone: true,
    selector: 'asset-sg-datepicker-toggle-icon',
    template,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerToggleIconComponent {}
