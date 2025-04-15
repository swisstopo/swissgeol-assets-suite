import { AppState } from '@asset-sg/client-shared';
import { createReducer, on } from '@ngrx/store';
import * as actions from './map-control.actions';

export interface AppStateWithMapControl extends AppState {
  mapControl: MapControlState;
}

export interface MapControlState {
  isDrawing: boolean;
}

const initialState: MapControlState = { isDrawing: false };

export const mapControlReducer = createReducer(
  initialState,
  on(actions.toggleDraw, (state) => ({ ...state, isDrawing: !state.isDrawing })),
  on(actions.cancelDraw, (state) => ({ ...state, isDrawing: false })),
);
