import { Contact } from '@asset-sg/shared';
import { Asset, AssetData, LocalDate, Role, User, UserData, WorkgroupId } from '@asset-sg/shared/v2';
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
  contactKindItemCode: fakeContactKindItemCode(),
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

export const fakeAssetData = (): AssetData => ({
  title: faker.commerce.productName(),
  originalTitle: faker.music.songName(),
  contacts: [],
  files: [],
  formatCode: fakeAssetFormatItemCode(),
  kindCode: fakeAssetKindItemCode(),
  parentId: null,
  identifiers: [],
  isOfNationalInterest: false,
  languageCodes: [],
  topicCodes: [],
  geometries: [],
  siblingIds: [],
  nationalInterestTypeCodes: [],
  workgroupId: 1,
  isPublic: faker.datatype.boolean(),
  legacyData: null,
  createdAt: LocalDate.fromDate(faker.date.past()),
  receivedAt: LocalDate.fromDate(faker.date.past()),
});

export const fakeAsset = (): Asset => ({
  id: fakeIdNumber(),
  title: faker.commerce.productName(),
  originalTitle: faker.music.songName(),
  contacts: [],
  files: [],
  formatCode: fakeAssetFormatItemCode(),
  kindCode: fakeAssetKindItemCode(),
  parentId: null,
  childrenIds: [],
  identifiers: [],
  isOfNationalInterest: false,
  languageCodes: [],
  topicCodes: [],
  siblingIds: [],
  workgroupId: 1,
  nationalInterestTypeCodes: [],
  isPublic: faker.datatype.boolean(),
  legacyData: null,
  createdAt: LocalDate.fromDate(faker.date.past()),
  receivedAt: LocalDate.fromDate(faker.date.past()),
  creatorId: null,
});
