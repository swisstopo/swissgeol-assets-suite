import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { TEST_ASSET } from '../common/create-test-asset';

When(/^A user types (.*) into the search field$/, (searchText: string) => {
  cy.get('.search-input').type(searchText);
  cy.wait(1_000);
});

When(/^The user clicks enter$/, () => {
  cy.wait(5_000);
  cy.get('.search-input').type('{enter}');
  cy.wait(1_000);
});

Then(/^The user should see the asset in results$/, () => {
  cy.get('asset-sg-animate-number:contains("0")', { timeout: 3000 }).should(
    'not.exist',
  );
  cy.get('.search-results').should('exist');
  cy.get('.search-results div:contains("CypressTestAsset")').should('exist');
});

Then(/^The asset should display all relevant attributes$/, () => {
  cy.get('[data-testid="assetTitle"]').should('contain.text', TEST_ASSET.title);

  cy.get('[data-testid="assetOriginalTitle"]').should(
    'contain.text',
    TEST_ASSET.originalTitle,
  );

  cy.get('[data-testid="assetKindCode"]').should('contain.text', 'Basemap');

  cy.get('[data-testid="assetDates"] dl').then(($dls) => {
    expect($dls.eq(0)).to.contain.text(TEST_ASSET.createdAt);
    expect($dls.eq(1)).to.contain.text(TEST_ASSET.receivedAt);
  });

  cy.get('[data-testid="assetAlternativeId"]').should('not.exist');

  cy.get('[data-testid="assetContacts"]').should('not.exist');

  cy.get('[data-testid="assetSubject"]').should('contain.text', 'Andere');

  cy.get('[data-testid="assetLanguage"]').should('not.exist');

  cy.get('[data-testid="assetFormat"]').should('contain.text', 'Unbekannt');

  cy.get('[data-testid="assetNatInt"]').should('contain.text', 'Ja');
  cy.get('[data-testid="assetNatIntCodes"]').should('not.contain.text');

  cy.get('[data-testid="assetReferences"]').should('not.exist');

  cy.get('[data-testid="assetNormalFiles"]').should('not.exist');

  cy.get('[data-testid="assetLegalFiles"]').should('not.exist');
});

Then(/^The footer should be visible as well as the edit asset button$/, () => {
  cy.get('[data-testid="assetFooter"]').should('be.visible');
  cy.get('[data-testid="edit-asset-button"]').should('be.visible');
});

Then(/^The footer should not be visible$/, () => {
  cy.get('[data-testid="assetFooter"]').should('not.exist');
  cy.get('[data-testid="edit-asset-button"]').should('not.exist');
});
