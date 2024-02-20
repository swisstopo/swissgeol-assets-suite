import { faker } from '@faker-js/faker';
import * as O from 'fp-ts/Option';

import { AssetUsage, PatchAsset, User, UserRoleEnum, dateIdFromDate } from '@asset-sg/shared';

import { fakeAssetFormatItemCode } from '../../../../../test/data/asset-format-item';
import { fakeAssetKindItemCode } from '../../../../../test/data/asset-kind-item';
import { fakeLanguageItemCode } from '../../../../../test/data/language-items';

import { AssetEditDetail } from './asset-edit.service';

let nextUniqueId = 0
const fakeIdNumber = (): number => nextUniqueId++;

const define = <T>(value: T): T => value;

const fakeAssetUsage = (): AssetUsage => ({
    isAvailable: faker.datatype.boolean(),
    startAvailabilityDate: O.fromNullable(faker.helpers.maybe(() => dateIdFromDate(faker.date.past()))),
    statusAssetUseItemCode: faker.helpers.arrayElement(['tobechecked', 'underclarification', 'approved']),
});

export const fakeUser = () => define<User>({
    email: faker.internet.email(),
    id: faker.string.uuid(),
    lang: faker.helpers.fromRegExp(/[a-z]{2}/),
    role: faker.helpers.arrayElement(Object.values(UserRoleEnum)),
})

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
    languageItemCode: fakeLanguageItemCode(),
    manCatLabelRefs: [],
    newStatusWorkItemCode: O.none,
    newStudies: [],
    receiptDate: dateIdFromDate(faker.date.past()),
    siblingAssetIds: [],
    studies: [],
    titleOriginal: faker.music.songName(),
    titlePublic: faker.commerce.productName(),
    typeNatRels: [],
})

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
    languageItemCode: fakeLanguageItemCode(),
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
})
