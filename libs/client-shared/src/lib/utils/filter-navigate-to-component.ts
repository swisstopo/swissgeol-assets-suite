import { Type } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { filter, map } from 'rxjs';

import { OO } from '@asset-sg/core';

export const filterNavigateToComponent = (source: Actions, component: Type<unknown>, ...parents: Type<unknown>[]) =>
    pipe(
        source,
        ofType<RouterNavigationAction<RouterStateSnapshot>>(ROUTER_NAVIGATION),
        map((a: RouterNavigationAction<RouterStateSnapshot>) => findSnapshot(component, a.payload.routerState.root)),
        OO.fromFilteredSome,
        filter(s => matchesParents(s, ...parents)),
    );

export const findSnapshot = (component: Type<unknown>, s: ActivatedRouteSnapshot): O.Option<ActivatedRouteSnapshot> => {
    if (s.routeConfig && s.routeConfig.component === component) {
        return O.some(s);
    }
    for (const c of s.children) {
        const ss = findSnapshot(component, c);
        if (O.isSome(ss)) {
            return ss;
        }
    }
    return O.none;
};

const matchesParents = (s: ActivatedRouteSnapshot, ...parents: Type<unknown>[]): boolean => {
    if (parents.length === 0) return true;
    const [parent, ...grandparents] = parents;
    if (!!s.parent && s.parent.routeConfig && s.parent.routeConfig.component === parent) {
        return matchesParents(s.parent, ...grandparents);
    }
    return false;
};
