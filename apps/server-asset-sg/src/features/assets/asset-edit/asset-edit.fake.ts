import { AssetEditDetail, AssetUsage, Contact, dateIdFromDate, PatchAsset } from '@asset-sg/shared';
import { Role, User, UserData, WorkgroupId } from '@asset-sg/shared/v2';
import { fakerDE_CH as faker } from '@faker-js/faker';
import * as O from 'fp-ts/Option';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetFormatItemCode } from '../../../../../../test/data/asset-format-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetKindItemCode } from '../../../../../../test/data/asset-kind-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeContactKindItemCode } from '../../../../../../test/data/contact-kind-item';

import { define } from '@/utils/define';

let nextUniqueId = 0;
const fakeIdNumber = (): number => nextUniqueId++;

export const fakeAssetUsage = (): AssetUsage => ({
  isAvailable: faker.datatype.boolean(),
  startAvailabilityDate: O.fromNullable(faker.helpers.maybe(() => dateIdFromDate(faker.date.past()))),
  statusAssetUseItemCode: faker.helpers.arrayElement(['tobechecked', 'underclarification', 'approved']),
});

export const fakeUser = () => {
  const roles = new Map<WorkgroupId, Role>();
  roles.set(1, Role.Reader);
  return define<User>({
    email: faker.internet.email(),
    lastName: faker.person.lastName(),
    firstName: faker.person.firstName(),
    id: faker.string.uuid(),
    lang: faker.helpers.fromRegExp(/[a-z]{2}/),
    isAdmin: false,
    roles,
  });
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

export const fakeContact = () =>
  define<Omit<Contact, 'id'>>({
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

export const fakeAssetPatch = (): PatchAsset => ({
  assetContacts: [],
  assetFiles: [],
  assetFormatItemCode: fakeAssetFormatItemCode(),
  assetKindItemCode: fakeAssetKindItemCode(),
  assetMainId: O.none,
  createDate: dateIdFromDate(faker.date.past()),
  ids: [],
  internalUse: fakeAssetUsage(),
  publicUse: fakeAssetUsage(),
  isNatRel: false,
  assetLanguages: [],
  manCatLabelRefs: [],
  newStatusWorkItemCode: O.none,
  newStudies: [],
  receiptDate: dateIdFromDate(faker.date.past()),
  siblingAssetIds: [],
  studies: [],
  titleOriginal: faker.music.songName(),
  titlePublic: faker.commerce.productName(),
  typeNatRels: [],
  workgroupId: 1,
});

export const fakeAssetEditDetail = (): AssetEditDetail => ({
  assetId: fakeIdNumber(),
  sgsId: faker.number.int({ min: 1 }),
  titleOriginal: faker.music.songName(),
  titlePublic: faker.commerce.productName(),
  assetContacts: [],
  assetFiles: [],
  assetFormatItemCode: fakeAssetFormatItemCode(),
  assetKindItemCode: fakeAssetKindItemCode(),
  assetMain: O.none,
  createDate: dateIdFromDate(faker.date.past()),
  geolAuxDataInfo: faker.hacker.phrase(),
  geolContactDataInfo: faker.vehicle.manufacturer(),
  geolDataInfo: faker.word.words({ count: { min: 4, max: 25 } }),
  ids: [],
  internalUse: fakeAssetUsage(),
  publicUse: fakeAssetUsage(),
  isNatRel: false,
  assetLanguages: [],
  lastProcessedDate: new Date(),
  manCatLabelRefs: [],
  municipality: '',
  processor: '',
  receiptDate: dateIdFromDate(faker.date.past()),
  siblingXAssets: [],
  siblingYAssets: [],
  statusWorks: [],
  studies: [],
  subordinateAssets: [],
  typeNatRels: [],
  workgroupId: 1,
});
