import {assetsBaseUrl} from '../../support/config/config';
import {Given} from '@badeball/cypress-cucumber-preprocessor';

Given('The user is logged in', () => {
  const userName: string = Cypress.env('basic_auth_username') as string;
  const password: string = Cypress.env('basic_auth_password') as string;
  cy.login(userName, password);
  cy.visit(assetsBaseUrl);
});
