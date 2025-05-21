import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

Then(/^The user should see logout page$/, () => {
  cy.get('img[alt="Logo Swissgeol Assets"]', { timeout: 3000 }).should(
    'not.exist',
  );
  cy.get('h1:contains("Logout")').should('exist');
});
When(/^The user clicks profile menu button$/, () => {
  cy.get('asset-sg-app-bar button.profile').click();
});
When(/^The user clicks logout button$/, () => {
  cy.get('button:contains("Abmelden")').click();
});
