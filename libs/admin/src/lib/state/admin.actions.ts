import { User, Workgroup, WorkgroupData } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';

export const findUser = createAction(
  '[Admin] Find User',
  props<{
    userId: string;
  }>()
);

export const setUser = createAction('[Admin] Set User', props<{ user: User }>());

export const updateUser = createAction(
  '[Admin] Update User',
  props<{
    user: User;
  }>()
);

export const listUsers = createAction('[Admin] List Users');

export const setUsers = createAction(
  '[Admin] Set Users',
  props<{
    users: User[];
  }>()
);

export const findWorkgroup = createAction(
  '[Admin] Find Workgroup',
  props<{
    workgroupId: number;
  }>()
);

export const setWorkgroup = createAction(
  '[Admin] Set Workgroup',
  props<{
    workgroup: Workgroup;
  }>()
);

export const addWorkgroup = createAction(
  '[Admin] Add Workgroup',
  props<{
    workgroup: Workgroup;
  }>()
);

export const resetUser = createAction('[Admin] Reset User');
export const resetWorkgroup = createAction('[Admin] Reset Workgroup');

export const setWorkgroups = createAction(
  '[Admin] Set Workgroups',
  props<{
    workgroups: Workgroup[];
  }>()
);

export const updateWorkgroup = createAction(
  '[Admin] Update Workgroup',
  props<{
    workgroupId: number;
    workgroup: WorkgroupData;
  }>()
);

export const createWorkgroup = createAction(
  '[Admin] Create Workgroup',
  props<{
    workgroup: WorkgroupData;
  }>()
);

export const deleteWorkgroup = createAction(
  '[Admin] Delete Workgroup',
  props<{
    workgroupId: number;
  }>()
);

export const removeWorkgroupAfterDelete = createAction(
  '[Admin] Remove Workgroup After Delete',
  props<{
    workgroupId: number;
  }>()
);

export const listWorkgroups = createAction('[Admin] List Workgroups');
