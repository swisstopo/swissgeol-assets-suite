import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see the sync progress$/, () => {
  cy.get('.progress').should('exist').and('be.visible');
});
When(/^The user clicks start sync button$/, () => {
  cy.get('button:contains("Synchronisation starten")').click();
});
When(/^A user clicks administration menu button$/, () => {
  cy.get('span:contains("Verwaltung")')
    .not(':contains("Benutzer Verwaltung")')
    .click();
  cy.wait(1000);
});
