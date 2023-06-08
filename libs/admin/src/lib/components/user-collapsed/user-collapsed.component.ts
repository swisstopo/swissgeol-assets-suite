import { Component, EventEmitter, Input, Output } from '@angular/core';

import { User } from '@asset-sg/shared';

@Component({
    selector: 'asset-sg-user-collapsed',
    templateUrl: './user-collapsed.component.html',
    styleUrls: ['./user-collapsed.component.scss'],
})
export class UserCollapsedComponent {
    @Input() public user?: User;
    @Input() public disableEdit = false;
    @Output('editClicked') public editClicked$ = new EventEmitter<string>();
}
