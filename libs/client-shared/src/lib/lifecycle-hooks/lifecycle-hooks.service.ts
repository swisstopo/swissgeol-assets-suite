import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class LifecycleHooks {
    onInit$ = new ReplaySubject<void>(1);
    onCheck$ = new ReplaySubject<void>(1);
    afterContentInit$ = new ReplaySubject<void>(1);
    afterContentChecked$ = new ReplaySubject<void>(1);
    afterViewInit$ = new ReplaySubject<void>(1);
    afterViewChecked$ = new ReplaySubject<void>(1);
    onDestroy$ = new ReplaySubject<void>(1);
}
