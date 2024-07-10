import { Policy } from '@/core/policy';
import { Asset } from '@/features/assets/asset.model';
import { Role } from '@/features/workgroups/workgroup.model';

export class AssetPolicy extends Policy<Asset> {
  canShow(value: Asset): boolean {
    // A user can see all assets in all workgroups that they are assigned to.
    return this.hasWorkgroup(value.workgroupId);
  }

  canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }

  canUpdate(value: Asset): boolean {
    // A user can update assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }

  canDelete(value: Asset): boolean {
    // A user can delete assets for all workgroups for which they are an Editor.
    return this.hasRole(Role.Editor, value.workgroupId);
  }
}
