import { createAction, props } from '@ngrx/store';
import { User, Workgroup, WorkgroupData } from '../services/admin.service';

export const findUser = createAction(
  '[Admin] Find user',
  props<{
    userId: string;
  }>()
);

export const setUser = createAction(
  '[Admin] Set user',
  props<{
    user: User;
  }>()
);

export const updateUser = createAction(
  '[Admin] Update User',
  props<{
    user: User;
  }>()
);

export const listUsers = createAction('[Admin] List users');

export const setUsers = createAction(
  '[Admin] Set users',
  props<{
    users: User[];
  }>()
);

export const findWorkgroup = createAction(
  '[Admin] Find workgroup',
  props<{
    workgroupId: number;
  }>()
);

export const setWorkgroup = createAction(
  '[Admin] Set workgroup',
  props<{
    workgroup: Workgroup;
  }>()
);

export const resetWorkgroup = createAction('[Admin] Reset workgroup');

export const setWorkgroups = createAction(
  '[Admin] Set workgroups',
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

export const createWorkgroupSuccess = createAction('[Admin] Create Workgroup Success');

export const listWorkgroups = createAction('[Admin] List workgroups');
