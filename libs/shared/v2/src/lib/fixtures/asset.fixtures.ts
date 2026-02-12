import { LocalDate, WorkflowStatus } from '@swissgeol/ui-core';
import { Asset } from '../models/asset';
import { AssetContactRole } from '../models/contact';
import { PageCategory } from '../models/page-classification';
import { LanguageCode } from '../models/reference-data';
import { contactFixtures } from './contact.fixtures';
import { fileFixtures } from './files.fixtures';
import { userFixtures } from './user.fixtures';

const minimal: Asset = {
  id: 1,
  title: 'A minimal asset',
  originalTitle: 'This is as empty as it gets',
  isPublic: false,
  restrictionDate: null,
  legacyData: null,
  formatCode: 'binary',
  kindCode: 'location',
  languageCodes: [],
  isOfNationalInterest: false,
  nationalInterestTypeCodes: [],
  topicCodes: [],
  identifiers: [],
  files: [],
  contacts: [],
  parent: null,
  children: [],
  siblings: [],
  workgroupId: 1,
  creatorId: null,
  createdAt: LocalDate.of(2025, 2, 1),
  receivedAt: LocalDate.of(2025, 4, 3),
  workflowStatus: WorkflowStatus.Draft,
};

fileFixtures.registerSampleReport(minimal);

const hauteSorne2dSeismic2023AcquisitionAndProcessingReport: Asset = {
  id: 2,
  title: 'Haute-Sorne 2D seismic 2023 - acquisition and processing report',
  originalTitle: 'Hybrid Seismic Survey - Factual report',
  isPublic: true,
  restrictionDate: null,
  legacyData: null,
  formatCode: 'pdf',
  kindCode: 'report',
  languageCodes: [LanguageCode.English],
  isOfNationalInterest: true,
  nationalInterestTypeCodes: ['partiConf'],
  topicCodes: ['energyRessources', 'geophysics', 'exploration'],
  identifiers: [],
  files: [],
  contacts: [
    {
      id: contactFixtures.geoExpertAg.id,
      role: AssetContactRole.Author,
    },
    {
      id: contactFixtures.geoEnergieSuisse.id,
      role: AssetContactRole.Initiator,
    },
    {
      id: contactFixtures.geoEnergieSuisse.id,
      role: AssetContactRole.Supplier,
    },
  ],
  parent: null,
  children: [],
  siblings: [],
  workgroupId: 1,
  creatorId: userFixtures.editor.id,
  createdAt: LocalDate.of(2023, 8, 22),
  receivedAt: LocalDate.of(2024, 2, 9),
  workflowStatus: WorkflowStatus.Reviewed,
};

/**
 * IMPORTANT: The current implementation of asset fixtures is directly tied to both the OCR and the Dataextraction
 * service; the below given details for fileFixtures must be changed if the OCR or Dataextraction results change, which
 * can happen when e.g. their extraction mechanisms are fine-tuned. In such cases, the createFixtures command will
 * log a different expectation, which can be seen in the pipelines and locally.
 *
 * See https://github.com/swisstopo/swissgeol-assets-suite/issues/804 for more information.
 */
fileFixtures.register(hauteSorne2dSeismic2023AcquisitionAndProcessingReport, {
  name: 'haute-sorne_2D_light_2023_swisstopo_technical_note.pdf',
  size: 2_777_874,
  lastModifiedAt: new Date('2025-09-11T16:18:00'),
  pageCount: 13,
  pageRangeClassifications: [
    { to: 1, from: 1, languages: ['de'], categories: [PageCategory.Text] },
    { to: 5, from: 2, languages: ['en'], categories: [PageCategory.Text] },
    { to: 8, from: 6, languages: ['en'], categories: [PageCategory.Unknown] },
    { to: 10, from: 9, languages: ['en'], categories: [PageCategory.Text] },
    { to: 11, from: 11, languages: ['en'], categories: [PageCategory.Boreprofile] },
    { to: 12, from: 12, languages: ['en'], categories: [PageCategory.Unknown] },
    { to: 13, from: 13, languages: ['en'], categories: [PageCategory.Text] },
  ],
});

export const assetFixtures = {
  minimal,
  hauteSorne2dSeismic2023AcquisitionAndProcessingReport,
};
