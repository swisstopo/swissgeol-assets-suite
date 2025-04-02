import { createAction, props } from '@ngrx/store';

import { Alert, AlertId } from './alert.model';

export const showAlert = createAction('[Alert] Create Alert', props<{ alert: Alert }>());
export const hideAlert = createAction('[Alert] Remove Alert', props<{ id: AlertId }>());
