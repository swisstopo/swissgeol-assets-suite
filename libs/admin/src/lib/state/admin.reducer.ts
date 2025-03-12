import { AppState } from '@asset-sg/client-shared';
import { User, Workgroup } from '@asset-sg/shared/v2';
import { createReducer, on } from '@ngrx/store';
import * as actions from './admin.actions';

export interface AdminState {
  selectedWorkgroup: Workgroup | null;
  workgroups: Workgroup[];
  selectedUser: User | null;
  users: User[];
  isLoading: boolean;
}

export interface AppStateWithAdmin extends AppState {
  admin: AdminState;
}

const initialState: AdminState = {
  selectedWorkgroup: null,
  workgroups: [],
  selectedUser: null,
  users: [],
  isLoading: false,
};

export const adminReducer = createReducer(
  initialState,
  on(
    actions.findUser,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.updateUser,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.setUser,
    (state, { user }): AdminState => ({
      ...state,
      selectedUser: user,
      isLoading: false,
    })
  ),
  on(
    actions.findWorkgroup,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.updateWorkgroup,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.createWorkgroup,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(actions.setWorkgroup, (state, { workgroup }): AdminState => {
    const workgroups = [...state.workgroups];
    const i = workgroups.findIndex((it) => it.id === workgroup.id);
    if (i < 0) {
      workgroups.push(workgroup);
    } else {
      workgroups[i] = workgroup;
    }
    return {
      ...state,
      workgroups,
      selectedWorkgroup: workgroup,
      isLoading: false,
    };
  }),
  on(
    actions.addWorkgroup,
    (state, { workgroup }): AdminState => ({
      ...state,
      workgroups: [...state.workgroups, workgroup],
    })
  ),
  on(
    actions.resetWorkgroup,
    (state): AdminState => ({
      ...state,
      selectedWorkgroup: null,
    })
  ),
  on(
    actions.listUsers,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.setUsers,
    (state, { users }): AdminState => ({
      ...state,
      users,
      isLoading: false,
    })
  ),
  on(
    actions.listWorkgroups,
    (state): AdminState => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    actions.setWorkgroups,
    (state, { workgroups }): AdminState => ({
      ...state,
      workgroups,
      isLoading: false,
    })
  ),
  on(
    actions.removeWorkgroupAfterDelete,
    (state, { workgroupId }): AdminState => ({
      ...state,
      workgroups: state.workgroups.filter((workgroup) => workgroup.id !== workgroupId),
      isLoading: false,
    })
  )
);
