import { Asset } from '../models/asset';
import { FileProcessingStage, FileProcessingState } from '../models/asset-file';
import { PageCategory, PageRangeClassification } from '../models/page-classification';

export interface RegisterFileOptions {
  name: string;
  pageCount: number;
  size: number;
  lastModifiedAt: Date;
  pageRangeClassifications: PageRangeClassification[];
}

const register = (asset: Asset, options: RegisterFileOptions): void => {
  const name = `a${asset.id}_${options.name}`;
  asset.files.push({
    id: Number(`${asset.id * 100}${asset.files.length}`),
    name,
    alias: options.name,
    size: options.size,
    pageCount: options.pageCount,
    legalDocCode: null,
    lastModifiedAt: options.lastModifiedAt,
    fileProcessingState: FileProcessingState.Success,
    fileProcessingStage: FileProcessingStage.Extraction,
    pageRangeClassifications: options.pageRangeClassifications,
  });
};

const registerSampleReport = (asset: Asset) =>
  register(asset, {
    name: 'sample-report.pdf',
    pageCount: 10,
    size: 2_515_221,
    lastModifiedAt: new Date(),
    pageRangeClassifications: [
      { to: 2, from: 1, languages: ['en'], categories: [PageCategory.Unknown] },
      {
        to: 3,
        from: 3,
        languages: ['en'],
        categories: [PageCategory.Text],
      },
      { to: 4, from: 4, languages: [], categories: [PageCategory.Text] },
      {
        to: 5,
        from: 5,
        languages: ['en'],
        categories: [PageCategory.Unknown],
      },
      { to: 6, from: 6, languages: [], categories: [PageCategory.Unknown] },
      {
        to: 7,
        from: 7,
        languages: ['en'],
        categories: [PageCategory.Unknown],
      },
      { to: 8, from: 8, languages: [], categories: [PageCategory.Unknown] },
      {
        to: 9,
        from: 9,
        languages: [],
        categories: [PageCategory.Text],
      },
      { to: 10, from: 10, languages: [], categories: [PageCategory.Unknown] },
    ],
  });

export const fileFixtures = {
  register,
  registerSampleReport,
};
