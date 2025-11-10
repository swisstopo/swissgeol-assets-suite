import { AssetFile, fixtures, PageClassification } from '@asset-sg/shared/v2';
import { After, Given } from '@badeball/cypress-cucumber-preprocessor';
import { searchAndSelectAssetById } from './search';

export const assetWithPdf = fixtures.assets.hauteSorne2dSeismic2023AcquisitionAndProcessingReport;
export const pdf = assetWithPdf.files[0] as AssetFile & { pageClassifications: PageClassification[] };

Given(/^an asset with a PDF has been selected$/, () => {
  searchAndSelectAssetById(assetWithPdf.id);

  cy.get('asset-sg-asset-search-detail').as('detail').should('contain.text', assetWithPdf.title);
});

After({ tags: '@mutation' }, () => {
  cy.exec('npm run api-command -- fixtures:create');
});
