import { Contact } from '../models/contact';
import { Role } from '../models/workgroup';
import { Policy } from './base/policy';

export class ContactPolicy extends Policy<Contact> {
  canShow(_value: Contact): boolean {
    return this.hasRole(Role.Editor);
  }

  canCreate(): boolean {
    // A user can create assets for workgroups for which they are an Editor.
    return this.hasRole(Role.Editor);
  }
}
