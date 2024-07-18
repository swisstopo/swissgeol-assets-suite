import { Role, WorkgroupId } from '@shared/models/workgroup';
import { Policy } from '@shared/policies/base/policy';

type Asset = { workgroupId: WorkgroupId };

export class AssetEditPolicy extends Policy<Asset> {
  override canShow(value: Asset): boolean {
    // A user can see all assets in all workgroups that they are assigned to.
    return this.hasWorkgroup(value.workgroupId);
  }

  override canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }

  override canUpdate(value: Asset): boolean {
    // A user can update assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }

  override canDelete(value: Asset): boolean {
    // A user can delete assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }
}
