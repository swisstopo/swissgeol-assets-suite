import { Pipe, PipeTransform } from '@angular/core';

import { fromAppShared } from '../../state';

import { BaseAuthPipe } from './base-auth-pipe';

@Pipe({
    standalone: true,
    name: 'isNotMasterEditor',
    pure: false,
})
export class IsNotMasterEditorPipe extends BaseAuthPipe implements PipeTransform {
    constructor() {
        super(true, store => store.select(fromAppShared.selectIsNotMasterEditor));
    }
}
