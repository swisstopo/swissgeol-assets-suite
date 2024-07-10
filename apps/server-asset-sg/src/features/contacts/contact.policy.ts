import { Policy } from '@/core/policy';
import { Contact } from '@/features/contacts/contact.model';
import { Role } from '@/features/workgroups/workgroup.model';

export class ContactPolicy extends Policy<Contact> {
  canShow(_value: Contact): boolean {
    return this.hasRole(Role.Editor);
  }

  canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }
}
