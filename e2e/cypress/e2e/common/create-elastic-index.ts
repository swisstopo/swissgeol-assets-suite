import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see the sync progress$/, () => {
  cy.get('.progress').should('exist').and('be.visible');
  cy.get('.progress').should('contain', '0%');
  cy.get('.progress').should('not.contain', '0%');
});
When(/^The user clicks start sync button$/, () => {
  cy.get('button:contains("Synchronisation starten")').click();
});
When(/^A user clicks administration menu button$/, () => {
  cy.get('ul.submenu > li > a[href="/de/asset-admin"]').click();
  cy.wait(1000);
});
