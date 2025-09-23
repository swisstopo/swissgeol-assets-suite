import { AssetId } from '@asset-sg/shared/v2';

export const searchAndSelectAssetById = (assetId: AssetId): void => {
  cy.wait(1000);
  cy.get('[data-testid="searchInput"]').type(`id:${assetId}`).type('{enter}');

  cy.get('asset-sg-asset-search-results')
    .find('.search-results .table-container tr.mat-mdc-row')
    .as('searchResult')
    .should('have.length', 1);

  cy.get('@searchResult').click();
};
