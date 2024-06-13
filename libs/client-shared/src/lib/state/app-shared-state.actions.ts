import * as RD from '@devexperts/remote-data-ts';
import { createAction, props } from '@ngrx/store';

import { Contact, Lang, ReferenceData, User } from '@asset-sg/shared';

import { ApiError } from '../utils';

export const loadReferenceData = createAction('[App Shared State] Load Reference Data');
export const loadReferenceDataResult = createAction(
  '[App Shared State] Load Reference Data Result',
  props<RD.RemoteData<ApiError, ReferenceData>>(),
);

export const createContactResult = createAction(
  '[App Shared State] Create Contact Result',
  props<RD.RemoteData<ApiError, Contact>>(),
);
export const editContactResult = createAction(
  '[App Shared State] Edit Contact Result',
  props<RD.RemoteData<ApiError, Contact>>(),
);

export const loadUserProfile = createAction('[App Shared State] Load User Profile');
export const loadUserProfileResult = createAction(
  '[App Shared State] Load User Profile Result',
  props<RD.RemoteData<ApiError, User>>(),
);

export const triggerSearch = createAction('[App Shared State] Trigger Search');
export const openPanel = createAction('[App Shared State] Open Panel');
export const closePanel = createAction('[App Shared State] Close Panel');

export const logout = createAction('[App Shared State] Logout');

export const setLang = createAction('[App Shared State] Set Lang', props<{ lang: Lang }>());
