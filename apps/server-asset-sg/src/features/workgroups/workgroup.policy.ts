import { Policy } from '@/core/policy';
import { Workgroup } from '@/features/workgroups/workgroup.model';

export class WorkgroupPolicy extends Policy<Workgroup> {
  canShow(value: Workgroup): boolean {
    // A user can see every workgroup assigned to them.
    return this.hasWorkgroup(value.id);
  }

  canCreate(): boolean {
    // Only admins can create workgroups.
    return false;
  }
}
