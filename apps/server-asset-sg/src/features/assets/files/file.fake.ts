import { AssetFile, FileProcessingStage, FileProcessingState } from '@asset-sg/shared/v2';
import { fakerDE_CH as faker } from '@faker-js/faker';

let nextUniqueId = 0;
const fakeIdNumber = (): number => nextUniqueId++;

export const fakeFile = (): AssetFile => ({
  id: fakeIdNumber(),
  name: faker.system.fileName(),
  alias: null,
  size: faker.number.int({ min: 1024, max: 1e10 }),
  pageCount: faker.number.int({ min: 1, max: 50 }),
  legalDocCode: null,
  lastModifiedAt: faker.date.past({ years: 10 }),
  fileProcessingStage: faker.helpers.enumValue(FileProcessingStage),
  fileProcessingState: faker.helpers.enumValue(FileProcessingState),
  pageClassifications: null,
});
