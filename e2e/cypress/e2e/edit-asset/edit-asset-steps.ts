import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^The user selects asset from the results$/, () => {
  cy.get('td:contains("CypressTestAsset")', { timeout: 3000 })
    .first()
    .click({ force: true });
});
When(/^The user clicks edit button$/, () => {
  cy.get('svg-icon[data-testid="edit-asset-button"]').click();
});

Then(/^The user should see asset details$/, () => {
  cy.get('.asset-detail').should('be.visible');
});

When(/^The user edits asset information$/, () => {
  cy.get('mat-label:contains("Alternativ-ID")')
    .first()
    .type('BeschreibungTest');
  cy.wait(1000);
});
When(/^The user clicks save$/, () => {
  cy.intercept('http://localhost:4200/api/asset-edit/**').as('edit');
  cy.get('button:contains("Administration")').click();
  cy.get('button:contains("Speichern")').click();
  cy.wait(1000);
});
Then(/^The changes are saved$/, () => {
  cy.wait('@edit').then((xhr) => {
    cy.log(xhr.request.url);
    expect(xhr.response.statusCode).to.eq(200);
  });
});
