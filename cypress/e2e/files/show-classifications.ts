import { fixtures } from '@asset-sg/shared/v2';
import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import { searchAndSelectAssetById } from '../common/search';

const assetWithPdf = fixtures.assets.hauteSorne2dSeismic2023AcquisitionAndProcessingReport;
const pdf = assetWithPdf.files[0];

Given(/^an asset with a PDF has been selected$/, () => {
  searchAndSelectAssetById(assetWithPdf.id);

  cy.get('asset-sg-asset-search-detail').as('detail').should('contain.text', assetWithPdf.title);
});

Then(/^the asset's details contain its PDF$/, () => {
  cy.get('@detail')
    .find('[data-testid="assetNormalFiles"]')
    .find('asset-sg-asset-viewer-files > .file:first-child')
    .as('file')
    .should('exist');

  cy.get('@file')
    .find('.file__info__file-name')
    .should('have.text', pdf.alias ?? pdf.name);
});

Then(/^the PDF shows its page number$/, () => {
  cy.get('@file')
    .find('asset-sg-asset-viewer-files-content-summary asset-sg-asset-viewer-files-tag:first')
    .should('have.text', `${pdf.pageCount} pages`);
});
Then(/^the PDF shows all of its classifications$/, () => {});
