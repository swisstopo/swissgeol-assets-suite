import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Store } from '@ngrx/store';
import { User } from '@shared/models/user';
import { filter, map } from 'rxjs';

import { AppState } from './state/app-state';

export const roleGuard = (testUser: (u: User) => boolean) => {
  const store = inject(Store<AppState>);
  return store.select(fromAppShared.selectUser).pipe(filter(isNotNull), map(testUser));
};

export const adminGuard: CanActivateFn = () => roleGuard((user) => user.isAdmin);
