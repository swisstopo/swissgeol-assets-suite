import { NumberInput } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PushModule } from '@rx-angular/template/push';
import * as bezier from 'bezier-easing';
import {
    BehaviorSubject,
    animationFrameScheduler,
    distinctUntilChanged,
    endWith,
    interval,
    map,
    scan,
    switchMap,
    takeWhile,
} from 'rxjs';

@Component({
    standalone: true,
    selector: 'asset-sg-animate-number',
    template: '{{ value$ | push }}',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PushModule],
})
export class AnimateNumberComponent {
    private _nextValue$ = new BehaviorSubject<number>(0);

    @Input()
    public set nextValue(value: NumberInput) {
        const v = Number(value?.valueOf());

        if (!isNaN(v)) {
            this._nextValue$.next(v);
        }
    }

    public value$ = this._nextValue$.pipe(
        scan((acc, v) => [acc[1], v], [0, 0]),
        switchMap(([from, to]) =>
            duration(225).pipe(
                map(easing),
                map(t => Math.round(from + (to - from) * t)),
                endWith(to),
                distinctUntilChanged(),
            ),
        ),
    );
}

const msElapsed = (scheduler = animationFrameScheduler) => {
    const start = scheduler.now();
    return interval(0, scheduler).pipe(map(() => scheduler.now() - start));
};

const duration = (ms: number, scheduler = animationFrameScheduler) =>
    msElapsed(scheduler).pipe(
        map(ems => ems / ms),
        takeWhile(t => t <= 1, true),
    );

const easing = bezier(0.25, 0.8, 0.25, 1);
