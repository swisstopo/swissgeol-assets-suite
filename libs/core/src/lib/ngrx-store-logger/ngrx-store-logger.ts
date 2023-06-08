import { Action, MetaReducer } from '@ngrx/store';

const formatTime = (time: Date) =>
    new Date(time.getTime() - time.getTimezoneOffset() * 60000).toISOString().substring(11, 23);

const initActions = ['@ngrx/store/init', '@ngrx/effects/init'];

export function storeLogger<S>(): MetaReducer<S, Action> {
    let prevState: S | undefined;
    return reducer => (state, action) => {
        const started = performance.now();
        const startedTime = new Date();

        const nextState = reducer(state, action);

        const took = performance.now() - started;

        if (!initActions.includes(action.type)) {
            console.group(`action ${formatTime(startedTime)} ${action.type} (in ${took.toFixed(2)} ms)`);
            console.log(`%c prev state`, `color: #9E9E9E; font-weight: bold`, prevState);
            console.log(`%c action`, `color: #03A9F4; font-weight: bold`, action);
            console.log(`%c next state`, `color: #4CAF50; font-weight: bold`, nextState);
            console.groupEnd();
        }

        prevState = nextState;

        return nextState;
    };
}
