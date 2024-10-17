import { createSelector } from '@ngrx/store';
import { AppStateWithMapControl } from './map-control.reducer';

const mapControlFeature = (state: AppStateWithMapControl) => state.mapControl;

export const selectMapControlIsDrawing = createSelector(mapControlFeature, (state) => state.isDrawing);
