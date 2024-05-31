import {assetsBaseUrl} from '../../support/config/config';
import {Given} from '@badeball/cypress-cucumber-preprocessor';

Given('The user is logged in', () => {
  const userName: string = Cypress.env('basicAuthUsername') as string;
  const password: string = Cypress.env('basicAuthPassword') as string;
  cy.login(userName, password);
  cy.visit(assetsBaseUrl);
});
