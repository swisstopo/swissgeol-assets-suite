import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see the asset in results$/, () => {
  cy.wait(1000);
  cy.get('asset-sg-animate-number:contains("0")', { timeout: 3000 }).should(
    'not.exist',
  );
  cy.get('.search-results').should('exist');
  cy.get('.search-results div:contains("CypressTestAsset")').should('exist');
});
When(/^The user clicks enter$/, () => {
  cy.get('.search-input').type('{enter}');
});
When(/^A user types (.*) into the search field$/, (searchText: string) => {
  cy.get('.search-input').type(searchText);
  cy.wait(1000);
});
