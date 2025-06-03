import { fakerDE_CH as faker } from '@faker-js/faker';

// @ts-expect-error: import file from outside rootDir
import { fakeAssetFormatItemCode } from './/test/data/asset-format-item';
// @ts-expect-error: import file from outside rootDir
import { fakeContactKindItemCode } from './/test/data/contact-kind-item';
import { AssetInfo } from './asset';
import { LocalDate } from './base/local-date';

let nextUniqueId = 0;
const fakeIdNumber = (): number => nextUniqueId++;

export const fakeAssetInfo = (): AssetInfo => ({
  id: fakeIdNumber(),
  title: faker.commerce.product(),
  originalTitle: faker.commerce.product(),
  kindCode: fakeContactKindItemCode(),
  formatCode: fakeAssetFormatItemCode(),
  identifiers: [],
  languageCodes: [],
  contactAssignments: [],
  manCatLabelCodes: [],
  natRelCodes: [],
  links: {
    parent: null,
    children: [],
    siblings: [],
  },
  files: [],
  createdAt: LocalDate.fromDate(faker.date.past()),
  receivedAt: LocalDate.fromDate(faker.date.past()),
});
