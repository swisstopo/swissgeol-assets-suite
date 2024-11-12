import { Favorite } from '../models/favorite';
import { Policy } from './base/policy';

export class FavoritePolicy extends Policy<Favorite> {
  canShow(value: Favorite): boolean {
    // A user can see their own favorites.
    return value.userId == this.user.id;
  }

  override canCreate(): boolean {
    // Every user can add to their own favorites.
    return true;
  }

  override canUpdate(value: Favorite): boolean {
    return this.canShow(value);
  }
}
