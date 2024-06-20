import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AlertState, alertFeature } from './alert.reducer';

export const selectAlertState = createFeatureSelector<AlertState>(alertFeature);

export const selectAlerts = createSelector(selectAlertState, (state) => Object.values(state));
