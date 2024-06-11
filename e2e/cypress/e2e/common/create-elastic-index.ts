import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see the sync progress$/, () => {
  cy.get('asset-sg-animate-number:contains("0")', {timeout: 3000}).should('not.exist');
  cy.get('.asset-body').should('exist');
  cy.get('.search-results div:contains("CypressTestAsset")').should('exist');
});
When(/^The user clicks start sync button$/, () => {
  cy.get('.search-input').type('{enter}');
});
When(/^A user clicks administration menu button$/, (searchText: string) => {
  cy.get('.search-input').type(searchText);
  cy.wait(1000);
});
