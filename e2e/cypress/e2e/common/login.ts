import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('The user is logged in', () => {
  const userName: string = Cypress.env('basicAuthUsername') as string;
  const password: string = Cypress.env('basicAuthPassword') as string;
  cy.login(userName, password);
  cy.visit('/de');
  cy.visit('/de');
});

Then('The assets application is visible', () => {
  cy.get('asset-sg-map', { timeout: 10_000 }).should('be.visible');
});
