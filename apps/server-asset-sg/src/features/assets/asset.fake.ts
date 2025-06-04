import {
  Asset,
  UpdateAssetData,
  LocalDate,
  Role,
  User,
  UserData,
  WorkgroupId,
  Contact,
  AssetData,
  CreateAssetData,
} from '@asset-sg/shared/v2';
import { fakerDE_CH as faker } from '@faker-js/faker';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetFormatItemCode } from '../../../../../test/data/asset-format-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetKindItemCode } from '../../../../../test/data/asset-kind-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeContactKindItemCode } from '../../../../../test/data/contact-kind-item';

let nextUniqueId = 0;
const fakeIdNumber = (): number => nextUniqueId++;

export const fakeUser = (): User => {
  const roles = new Map<WorkgroupId, Role>();
  roles.set(1, Role.Reader);
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    lastName: faker.person.lastName(),
    firstName: faker.person.firstName(),
    lang: faker.helpers.fromRegExp(/[a-z]{2}/),
    isAdmin: false,
    roles,
  };
};

export const fakeUserData = (): UserData & { oidcId: string; email: string } => ({
  email: faker.internet.email(),
  lastName: faker.person.lastName(),
  firstName: faker.person.firstName(),
  lang: 'de',
  oidcId: faker.string.uuid(),
  isAdmin: false,
  roles: new Map(),
});

export const fakeContact = (): Omit<Contact, 'id'> => ({
  kindCode: fakeContactKindItemCode(),
  name: faker.company.name(),
  street: faker.location.street(),
  houseNumber: faker.location.buildingNumber(),
  plz: faker.location.zipCode(),
  locality: faker.location.city(),
  country: faker.location.country(),
  telephone: faker.phone.number(),
  email: faker.internet.email(),
  website: faker.internet.domainName(),
});

const fakeAssetData = (): AssetData => ({
  title: faker.commerce.productName(),
  originalTitle: faker.music.songName(),
  contacts: [],
  formatCode: fakeAssetFormatItemCode(),
  kindCode: fakeAssetKindItemCode(),
  parent: null,
  identifiers: [],
  isOfNationalInterest: false,
  languageCodes: [],
  topicCodes: [],
  siblings: [],
  nationalInterestTypeCodes: [],
  workgroupId: 1,
  isPublic: faker.datatype.boolean(),
  createdAt: LocalDate.fromDate(faker.date.past()),
  receivedAt: LocalDate.fromDate(faker.date.past()),
});

export const fakeCreateAssetData = (): CreateAssetData => ({
  ...fakeAssetData(),
  geometries: [],
});

export const fakeUpdateAssetData = (): UpdateAssetData => ({
  ...fakeAssetData(),
  geometries: [],
  files: [],
});

export const fakeAsset = (): Asset => ({
  id: fakeIdNumber(),
  title: faker.commerce.productName(),
  originalTitle: faker.music.songName(),
  contacts: [],
  files: [],
  formatCode: fakeAssetFormatItemCode(),
  kindCode: fakeAssetKindItemCode(),
  parent: null,
  children: [],
  identifiers: [],
  isOfNationalInterest: false,
  languageCodes: [],
  topicCodes: [],
  siblings: [],
  workgroupId: 1,
  nationalInterestTypeCodes: [],
  isPublic: faker.datatype.boolean(),
  legacyData: null,
  createdAt: LocalDate.fromDate(faker.date.past()),
  receivedAt: LocalDate.fromDate(faker.date.past()),
  creatorId: null,
});
