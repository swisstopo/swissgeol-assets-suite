import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { PushModule } from '@rx-angular/template/push';

import { AnchorComponent, ButtonComponent, DrawerComponent, DrawerPanelComponent } from '@asset-sg/client-shared';

import { ProfileComponent } from './components/profile';

@NgModule({
    declarations: [ProfileComponent],
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: '',
                component: ProfileComponent,
            },
        ]),
        TranslateModule.forChild(),

        LetModule,
        PushModule,

        MatProgressBarModule,

        ButtonComponent,
        AnchorComponent,
        DrawerComponent,
        DrawerPanelComponent,
    ],
})
export class ProfileModule {}
