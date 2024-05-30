import {When, Then} from '@badeball/cypress-cucumber-preprocessor';

When('The user clicks log out button', () => {
  cy.get('[data-test="header_logout-button"]').click();
});
Then('The user is logged out', () => {
  cy.url().should('include', 'gin/saml/logout');
});
