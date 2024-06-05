import {Then, When} from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see a test information in results$/, () => {
  cy.get('asset-sg-animate-number:contains("0")', {timeout: 3000}).should('not.exist');
  cy.get('.asset-body').should('exist');
  cy.get('.search-results div:contains("test")').should('exist');
});
When(/^The user clicks enter$/, () => {
  cy.get('.search-input').type('{enter}');
});
When(/^A user types information into the search field$/, () => {
  cy.get('.search-input').type('test');
});
