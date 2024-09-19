import { Workgroup } from '../models/workgroup';
import { Policy } from './base/policy';

export class WorkgroupPolicy extends Policy<Workgroup> {
  canShow(value: Workgroup): boolean {
    // A user can see every workgroup assigned to them.
    return this.hasWorkgroup(value.id);
  }

  canCreate(): boolean {
    // Only admins can create workgroups.
    return this.canDoEverything() || false;
  }
}
