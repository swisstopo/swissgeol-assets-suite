import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^A user clicks administration menu button$/, () => {
  cy.get('ul.submenu > li > a[href="/de/asset-admin"]').click();
  cy.wait(1000);
});

When(/^The user clicks start sync button$/, () => {
  cy.get('button:contains("Synchronisation starten")').click();
});

Then(/^The user should see the sync progress$/, () => {
  let callCount = 0;

  cy.intercept('GET', 'http://localhost:4200/api/assets/sync', (req) => {
    callCount++;

    if (callCount === 1) {
      req.reply({ body: { progress: 0 } });
    } else if (callCount === 2) {
      req.reply({ body: { progress: 0.5 } });
    } else if (callCount === 3) {
      req.reply({ body: { progress: 1 } });
    } else {
      req.reply({ statusCode: 204 });
    }
  }).as('getSync');

  cy.get('.progress').should('exist').and('be.visible');

  cy.wait('@getSync');
  cy.get('.progress').should('contain', '0%');

  cy.wait('@getSync');
  cy.get('.progress').should('contain', '50%');

  cy.wait('@getSync');
  cy.get('.progress').should('contain', '100%');

  cy.wait('@getSync');
  cy.get('.progress').should('have.css', 'opacity', '0');
});
