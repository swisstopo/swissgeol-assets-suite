import { AssetFile, fixtures, PageClassification } from '@asset-sg/shared/v2';
import { After, Given } from '@badeball/cypress-cucumber-preprocessor';
import { restoreFixtures } from '../../support/fixtures';
import { getAssetDetail, searchAndSelectAssetById } from '../../support/pages/assetSearch';

export const assetWithPdf = fixtures.assets.hauteSorne2dSeismic2023AcquisitionAndProcessingReport;
export const pdf = assetWithPdf.files[0] as AssetFile & { pageClassifications: PageClassification[] };

Given(/^an asset with a PDF has been selected$/, () => {
  searchAndSelectAssetById(assetWithPdf.id);

  getAssetDetail().should('contain.text', assetWithPdf.title);
});

// Scenarios tagged with `@mutation` change persisted data, so the fixtures have to be
// recreated afterwards. Otherwise the changes leak into every scenario that runs later.
// This also has to happen when the fixtures were seeded outside of cypress, which is why it
// uses `restoreFixtures` rather than the skippable `setUpFixtures`.
After({ tags: '@mutation' }, () => {
  restoreFixtures();
});
