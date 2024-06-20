import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { User, Users, byEmail } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { makeADT, ofType } from '@morphic-ts/adt';
import * as A from 'fp-ts/Array';
import { ReplaySubject, forkJoin, map } from 'rxjs';

type AdminPageState = Loading | StateApiError | ReadMode | EditMode | CreateMode;

export class AdminPageStateMachine {
  private __state: AdminPageState = AdminPageState.of.loading({ showProgressBar: true });

  private set _state(state: AdminPageState) {
    this.__state = state;
    this.state$.next(state);
  }

  private get _state() {
    return this.__state;
  }

  public state$ = new ReplaySubject<AdminPageState>();

  public readonly stateIs = AdminPageState.is;
  public readonly stateIsAnyOf = AdminPageState.isAnyOf;

  constructor(
    private effects: {
      rdUserId$: ORD.ObservableRemoteData<ApiError, string>;
      getUsers: () => ORD.ObservableRemoteData<ApiError, Users>;
      updateUser: (user: User) => ORD.ObservableRemoteData<ApiError, void>;
      deleteUser: (id: string) => ORD.ObservableRemoteData<ApiError, void>;
    }
  ) {
    const { getUsers: _getUsers } = this.effects;
    this.effects = { ...this.effects, getUsers: () => _getUsers().pipe(ORD.map(A.sort(byEmail))) };
    this._load();
  }

  private _load() {
    this._state = AdminPageState.of.loading({ showProgressBar: true });

    forkJoin([this.effects.rdUserId$, this.effects.getUsers()])
      .pipe(map(([rdUserId, rdUsers]) => RD.combine(rdUserId, rdUsers)))
      .subscribe((rd) => {
        if (RD.isSuccess(rd)) {
          const [userId, users] = rd.value;
          this._state = this.createReadMode(userId, users);
        } else if (RD.isFailure(rd)) {
          this._state = AdminPageState.of.stateApiError({ showProgressBar: false, error: rd.error });
        }
      });
  }

  private createReadMode(userId: string, users: Users) {
    return AdminPageState.of.readMode({
      showProgressBar: false,
      _userId: userId,
      _users: users,
      usersVM: users.map((u) => ({ ...u, expanded: false, disableEdit: false })),
    });
  }

  public editUser(userId: string) {
    if (AdminPageState.is.readMode(this._state)) {
      this._state = AdminPageState.of.editMode({
        ...this._state,
        currentEditedUserId: userId,
        usersVM: this._state.usersVM.map((u) => ({
          ...u,
          expanded: u.id === userId,
          disableEdit: u.id !== userId,
        })),
      });
    }
  }

  public cancelEditOrSave() {
    if (AdminPageState.isAnyOf(['editMode', 'createMode'])(this._state)) {
      this._state = this.createReadMode(this._state._userId, this._state._users);
    }
  }

  public saveEditedUser(user: User) {
    if (AdminPageState.is.editMode(this._state)) {
      this._state = AdminPageState.as.editMode({ ...this._state, showProgressBar: true });
      this.modifyAndReload(this.effects.updateUser(user), this._state._userId);
    }
  }

  public deleteUser(id: string) {
    if (AdminPageState.is.editMode(this._state)) {
      this._state = AdminPageState.as.editMode({ ...this._state, showProgressBar: true });
      this.modifyAndReload(this.effects.deleteUser(id), this._state._userId);
    }
  }

  private modifyAndReload(modify$: ORD.ObservableRemoteData<ApiError, unknown>, userId: string) {
    modify$
      .pipe(
        ORD.filterIsComplete,
        ORD.chainSwitchMapW(() => this.effects.getUsers())
      )
      .subscribe((rd) => {
        if (RD.isSuccess(rd)) {
          this._state = this.createReadMode(userId, rd.value);
        } else if (RD.isFailure(rd)) {
          this._state = AdminPageState.of.stateApiError({ showProgressBar: false, error: rd.error });
        }
      });
  }

  public reset() {
    this._load();
  }
}

interface UserVM extends User {
  expanded: boolean;
  disableEdit: boolean;
}

interface WithDataLoaded {
  showProgressBar: boolean;
  _userId: string;
  _users: Users;
  usersVM: UserVM[];
}

interface Loading {
  _tag: 'loading';
  showProgressBar: true;
}

interface StateApiError {
  _tag: 'stateApiError';
  showProgressBar: false;
  error: ApiError;
}

interface ReadMode extends WithDataLoaded {
  _tag: 'readMode';
  showProgressBar: false;
}

interface EditMode extends WithDataLoaded {
  _tag: 'editMode';
  showProgressBar: boolean;
  currentEditedUserId: string;
}

interface CreateMode extends WithDataLoaded {
  _tag: 'createMode';
  showProgressBar: boolean;
}

const AdminPageState = makeADT('_tag')({
  loading: ofType<Loading>(),
  readMode: ofType<ReadMode>(),
  editMode: ofType<EditMode>(),
  createMode: ofType<CreateMode>(),
  stateApiError: ofType<StateApiError>(),
});
