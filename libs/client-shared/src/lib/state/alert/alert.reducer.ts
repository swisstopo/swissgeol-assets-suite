import { createReducer, on } from '@ngrx/store';

import { hideAlert, showAlert } from './alert.actions';
import { Alert, AlertId } from './alert.model';

export const alertFeature = 'alert';

export type AlertState = Record<AlertId, AlertEntry>;

export interface AlertEntry {
  alert: Alert;
  metadata: AlertMetadata;
}

export interface AlertMetadata {
  createdAt: Date;
}

const initialState: AlertState = {};

export const alertReducer = createReducer(
  initialState,
  on(showAlert, (state, { alert }) => {
    const entry = { alert, metadata: { createdAt: new Date(), lifetime: 1 } };
    if (alert.id in state) {
      // If there is already an alert with the same id, we overwrite it by direct assignment.
      // With this, we preserve the id's insertion order, which ensures that the order of alerts does not change.
      const newState = { ...state };
      newState[alert.id] = entry;
      return newState;
    }
    return { ...state, [alert.id]: entry };
  }),
  on(hideAlert, (state, { id }) => {
    const newState = { ...state };
    delete newState[id];
    return newState;
  })
);
