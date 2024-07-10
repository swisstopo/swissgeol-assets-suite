import { User, WorkgroupOnUser } from '@/features/users/user.model';
import { getRoleIndex, Role, WorkgroupId } from '@/features/workgroups/workgroup.model';

export abstract class Policy<T> {
  private readonly workgroups = new Map<WorkgroupId, WorkgroupOnUser>();

  constructor(protected readonly user: User) {
    for (const workgroup of this.user.workgroups) {
      this.workgroups.set(workgroup.id, workgroup);
    }
  }

  protected hasWorkgroup(ids: WorkgroupId | Iterable<WorkgroupId>): boolean {
    ids = typeof ids === 'number' ? [ids] : ids;
    for (const id of ids) {
      if (this.workgroups.has(id)) {
        return true;
      }
    }
    return false;
  }

  protected withWorkgroup(
    ids: WorkgroupId | Iterable<WorkgroupId>,
    action: (workgroup: WorkgroupOnUser) => boolean
  ): boolean {
    ids = typeof ids === 'number' ? [ids] : ids;
    for (const id of ids) {
      const workgroup = this.workgroups.get(id);
      if (workgroup != null && action(workgroup)) {
        return true;
      }
    }
    return false;
  }

  hasRole(role: Role, ids?: WorkgroupId | Iterable<WorkgroupId>): boolean {
    const roleIndex = getRoleIndex(role);
    if (ids == null) {
      return null != this.user.workgroups.find((group) => getRoleIndex(group.role) >= roleIndex);
    }
    return this.withWorkgroup(ids, (group) => getRoleIndex(group.role) >= roleIndex);
  }

  canDoEverything(): boolean {
    return this.user.isAdmin;
  }

  abstract canShow(value: T): boolean;

  abstract canCreate(): boolean;

  canUpdate(_value: T): boolean {
    return this.canCreate();
  }

  canDelete(value: T): boolean {
    return this.canCreate();
  }
}
