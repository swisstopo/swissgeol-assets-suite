import { AssetUsage, Contact, PatchAsset, User, UserRoleEnum, dateIdFromDate } from '@asset-sg/shared';
import { fakerDE_CH as faker } from '@faker-js/faker';
import * as O from 'fp-ts/Option';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetFormatItemCode } from '../../../../../test/data/asset-format-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeAssetKindItemCode } from '../../../../../test/data/asset-kind-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { fakeContactKindItem } from '../../../../../test/data/contact-kind-item';

import { AssetEditDetail } from './asset-edit.service';

import { define } from '@/utils/define';

let nextUniqueId = 0;
const fakeIdNumber = (): number => nextUniqueId++;

export const fakeAssetUsage = (): AssetUsage => ({
  isAvailable: faker.datatype.boolean(),
  startAvailabilityDate: O.fromNullable(faker.helpers.maybe(() => dateIdFromDate(faker.date.past()))),
  statusAssetUseItemCode: faker.helpers.arrayElement(['tobechecked', 'underclarification', 'approved']),
});

export const fakeUser = () =>
  define<User>({
    email: faker.internet.email(),
    id: faker.string.uuid(),
    lang: faker.helpers.fromRegExp(/[a-z]{2}/),
    role: faker.helpers.arrayElement(Object.values(UserRoleEnum)),
  });

export const fakeContact = () =>
  define<Omit<Contact, 'id'>>({
    contactKindItemCode: fakeContactKindItem(),
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
  assetFormatCompositions: [],
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
