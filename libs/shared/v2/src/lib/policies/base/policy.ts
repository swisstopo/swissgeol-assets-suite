import { User } from '../../models/user';
import { getRoleIndex, Role, WorkgroupId } from '../../models/workgroup';

export abstract class Policy<T> {
  constructor(protected readonly user: User) {}

  protected hasWorkgroup(ids: WorkgroupId | Iterable<WorkgroupId>): boolean {
    ids = typeof ids === 'number' ? [ids] : ids;
    for (const id of ids) {
      if (this.user.roles.has(id)) {
        return true;
      }
    }
    return false;
  }

  protected withWorkgroupRole(ids: WorkgroupId | Iterable<WorkgroupId>, action: (role: Role) => boolean): boolean {
    ids = typeof ids === 'number' ? [ids] : ids;
    for (const id of ids) {
      const role = this.user.roles.get(id);
      if (role != null && action(role)) {
        return true;
      }
    }
    return false;
  }

  hasRole(role: Role, ids?: WorkgroupId | Iterable<WorkgroupId>): boolean {
    const roleIndex = getRoleIndex(role);
    if (ids == null) {
      for (const role of this.user.roles.values()) {
        if (getRoleIndex(role) >= roleIndex) {
          return true;
        }
      }
      return false;
    }
    return this.withWorkgroupRole(ids, (role) => getRoleIndex(role) >= roleIndex);
  }

  canDoEverything(): boolean {
    return this.user.isAdmin;
  }

  abstract canShow(value: T): boolean;

  abstract canCreate(): boolean;

  canUpdate(_value: T): boolean {
    return this.canCreate();
  }

  canDelete(_value: T): boolean {
    return this.canCreate();
  }
}
