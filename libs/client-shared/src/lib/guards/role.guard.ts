import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { isNotNull } from '@asset-sg/core';
import { User } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { AppState, fromAppShared } from '../state';

const guardRole = (testUser: (u: User) => boolean) => {
  const store = inject(Store<AppState>);
  return store.select(fromAppShared.selectUser).pipe(filter(isNotNull), map(testUser));
};

export const isAdminGuard: CanActivateFn = () => guardRole((user) => user.isAdmin);
