import { User } from '../models/user';
import { Role } from '../models/workgroup';

const admin: User = {
  id: '379a20e6-6a5d-4390-93ca-d408613e854d',
  email: 'admin@assets.swissgeol.ch',
  firstName: 'Admin',
  lastName: 'Istrator',
  lang: 'de',
  isAdmin: true,
  roles: new Map(),
};

const publisher: User = {
  id: 'e06ad465-3adc-4ad7-bee5-ff0605a4b928',
  email: 'publisher@assets.swissgeol.ch',
  firstName: 'Pub',
  lastName: 'Lisher',
  lang: 'de',
  isAdmin: false,
  roles: new Map([[1, Role.Publisher]]),
};

const reviewer: User = {
  id: '4ce5570e-6987-40c8-881a-362074020419',
  email: 'reviewer@assets.swissgeol.ch',
  firstName: 'Re',
  lastName: 'Viewer',
  lang: 'de',
  isAdmin: false,
  roles: new Map([[1, Role.Reviewer]]),
};

const editor: User = {
  id: '8e5cc1b6-61c0-49f5-92f9-1ac749524515',
  email: 'editor@assets.swissgeol.ch',
  firstName: 'Edit',
  lastName: 'Or',
  lang: 'de',
  isAdmin: false,
  roles: new Map([[1, Role.Editor]]),
};

const reader: User = {
  id: 'e064c0f6-0ca3-4225-b4ae-01ebf5f8bc62',
  email: 'reader@assets.swissgeol.ch',
  firstName: 'Rea',
  lastName: 'Der',
  lang: 'de',
  isAdmin: false,
  roles: new Map([[1, Role.Reader]]),
};

export const userFixtures = {
  reader,
  editor,
  reviewer,
  publisher,
  admin,
};
