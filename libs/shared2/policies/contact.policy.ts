import { Contact } from '@shared/models/contact';
import { Role } from '@shared/models/workgroup';
import { Policy } from '@shared/policies/base/policy';

export class ContactPolicy extends Policy<Contact> {
  canShow(_value: Contact): boolean {
    return this.hasRole(Role.Editor);
  }

  canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }
}
