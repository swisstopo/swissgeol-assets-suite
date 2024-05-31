/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {assetsBaseUrl} from '../config/config';

//login Eam
/*Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit(assetsBaseUrl);
  cy.get('[name="loginWithIdentityProvider"] div input[aria-label="idp-metadata-Swisstopo-BDMS-REF"]').last().click();
  cy.get('[type="email"]').type(username);
  cy.get('eiam-button[name="continueBtn"]').click();
  cy.get('[type="password"]').type(password);
  cy.get('eiam-buttonp[name="continueBtn"]').click();
});
*/

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit(assetsBaseUrl);
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="signInSubmitButton"]').click();
});

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session(['login', username, password], () => {
    cy.visit(assetsBaseUrl);
    cy.intercept('http://localhost:4011/connect/token').as('token');
    cy.origin('http://localhost:4011', {args: {username, password}}, ({username, password}) => {
      cy.get('#Input_Username').type(username);
      cy.get('#Input_Password').type(password);
      cy.contains('button', 'Login').click({force: true});
    });
    cy.wait('@token')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .then((interception) => interception.response.body.id_token)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .then((token) => window.localStorage.setItem('id_token', token));
  });
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
//export const bearerAuth = (token) => ({bearer: token});
