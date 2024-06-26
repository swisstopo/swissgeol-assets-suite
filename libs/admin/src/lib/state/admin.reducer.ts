import { AppState } from '@asset-sg/client-shared';
import { createReducer, on } from '@ngrx/store';
import { User, Workgroup } from '../services/admin.service';
import * as actions from './admin.actions';

export interface AdminState {
  selectedWorkgroup: Workgroup | undefined;
  workgroups: Workgroup[];
  selectedUser: User | undefined;
  users: User[];
  isLoading: boolean;
}

export interface AppStateWithAdmin extends AppState {
  admin: AdminState;
}

const initialState: AdminState = {
  selectedWorkgroup: undefined,
  workgroups: [],
  selectedUser: undefined,
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
  on(
    actions.setWorkgroup,
    (state, { workgroup }): AdminState => ({
      ...state,
      selectedWorkgroup: workgroup,
      isLoading: false,
    })
  ),
  on(
    actions.resetWorkgroup,
    (state): AdminState => ({
      ...state,
      selectedWorkgroup: undefined,
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
  )
);
