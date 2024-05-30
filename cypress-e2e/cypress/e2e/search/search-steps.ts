import {Then, When} from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see a test information in resutls$/, () => {
  cy.get('asset-sg-animate-number:contains("0")').should('not.exist');
  cy.get('.asset-body').should('exist');
});
When(/^The user clicks enter$/, () => {
  cy.get('.search-input').type('{enter}');
});
When(/^A user types information into the search field$/, () => {
  cy.get('.search-input').type('test');
});
