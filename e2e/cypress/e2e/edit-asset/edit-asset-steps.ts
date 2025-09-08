import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

let randomTitle = '';

When(/^The user selects asset from the results$/, () => {
  cy.get('td:contains("CypressTestAsset")', { timeout: 3000 })
    .first()
    .click({ force: true });
});
When(/^The user clicks edit button$/, () => {
  cy.get('sgc-button[data-testid="edit-asset-button"]').click();
});

Then(/^The user should see asset details$/, () => {
  cy.get('.asset-detail').should('be.visible');
});

When(/^The user edits asset information$/, () => {
  randomTitle = Array.from({ length: 20 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
      Math.floor(Math.random() * 62),
    ),
  ).join('');

  cy.get('asset-sg-text-area[data-testid="originalTitle"]')
    .find('textarea')
    .first()
    .clear()
    .type(randomTitle);
  cy.wait(1000);
});

When(/^The user clicks save$/, () => {
  cy.intercept('http://localhost:4200/api/assets/**').as('edit');
  cy.get('button:contains("Speichern")').click();
  cy.wait(1000);
});

Then(/^The changes are saved$/, () => {
  cy.wait('@edit').then((xhr) => {
    expect(xhr.response.statusCode).to.eq(200);
    expect(xhr.request.body.originalTitle).to.equal(randomTitle);
  });
});
