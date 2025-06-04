import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^A user clicks administration menu button$/, () => {
  cy.get('ul.submenu > li > a[href="/de/asset-admin"]').click();
  cy.wait(1000);
});

When(/^The user clicks start sync button$/, () => {
  cy.get('button:contains("Synchronisation starten")').click();
});

Then(/^The user should see the sync progress$/, () => {
  let progress = 0.1;
  cy.intercept('GET', 'http://localhost:4200/api/assets/sync', (req) => {
    req.reply({ body: { progress } });
  });

  cy.get('.progress').should('exist').and('be.visible');
  cy.wait(1_000);
  cy.get('.progress').should('contain', '0%');
  progress = 0.5;
  cy.wait(1_000);
  cy.get('.progress').should('contain', '50%');
});
