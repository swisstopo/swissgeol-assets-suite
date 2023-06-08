import { Pipe, PipeTransform } from '@angular/core';

import { fromAppShared } from '../../state';

import { BaseAuthPipe } from './base-auth-pipe';

@Pipe({
    standalone: true,
    name: 'isEditor',
    pure: false,
})
export class IsEditorPipe extends BaseAuthPipe implements PipeTransform {
    constructor() {
        super(false, store => store.select(fromAppShared.selectIsEditor));
    }
}
