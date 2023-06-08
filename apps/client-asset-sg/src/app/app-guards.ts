import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { map } from 'rxjs';

import { fromAppShared } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { User, isAdmin, isEditor } from '@asset-sg/shared';

import { AppState } from './state/app-state';

export const roleGuard = (rolePredicate: (u: User) => boolean) => {
    const store = inject(Store<AppState>);
    return store.select(fromAppShared.selectRDUserProfile).pipe(
        ORD.filterIsCompleteEither,
        map(user =>
            E.isRight(
                pipe(
                    user,
                    E.filterOrElseW(rolePredicate, () => undefined),
                ),
            ),
        ),
    );
};

export const adminGuard: CanActivateFn = () => roleGuard(isAdmin);
export const editorGuard: CanActivateFn = () => roleGuard(isEditor);
