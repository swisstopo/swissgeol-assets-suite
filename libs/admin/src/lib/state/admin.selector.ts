import { createSelector } from '@ngrx/store';
import { AppStateWithAdmin } from './admin.reducer';

const adminFeature = (state: AppStateWithAdmin) => state.admin;

export const selectSelectedUser = createSelector(adminFeature, (state) => state.selectedUser);
export const selectSelectedWorkgroup = createSelector(adminFeature, (state) => state.selectedWorkgroup);
export const selectWorkgroups = createSelector(adminFeature, (state) => state.workgroups);
export const selectUsers = createSelector(adminFeature, (state) => state.users);
export const selectIsLoading = createSelector(adminFeature, (state) => state.isLoading);
