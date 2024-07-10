import { AssetEditDetail } from '@asset-sg/shared';
import { Role } from '@shared/models/workgroup';
import { Policy } from '@shared/policies/base/policy';

export class AssetEditPolicy extends Policy<AssetEditDetail> {
  canShow(value: AssetEditDetail): boolean {
    // A user can see all assets in all workgroups that they are assigned to.
    return this.hasWorkgroup(value.workgroupId);
  }

  canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }

  canUpdate(value: AssetEditDetail): boolean {
    // A user can update assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }

  canDelete(value: AssetEditDetail): boolean {
    // A user can delete assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }
}
