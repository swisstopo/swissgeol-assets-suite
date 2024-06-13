/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { assetsBaseUrl } from '../config/config';

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
export const bearerAuth = (token) => ({ bearer: token });

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit(assetsBaseUrl);
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="signInSubmitButton"]').click();
});

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session(
    ['login', username, password],
    () => {
      cy.visit(assetsBaseUrl);
      cy.intercept('http://localhost:4011/connect/token').as('token');
      cy.origin(
        'http://localhost:4011',
        { args: { username, password } },
        ({ username, password }) => {
          cy.get('#Input_Username').type(username);
          cy.get('#Input_Password').type(password);
          cy.contains('button', 'Login').click({ force: true });
        }
      );
      cy.wait('@token')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then((interception) => interception.response.body.access_token)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .then((token) => window.localStorage.setItem('access_token', token));
    },
    {
      validate() {
        cy.window()
          .then((win) => win.localStorage.getItem('access_token'))
          .as('access_token');
        cy.get('@access_token').then((token) =>
          cy.request({
            method: 'GET',
            url: '/api/user',
            auth: bearerAuth(token),
          })
        );
      },
      cacheAcrossSpecs: true,
    }
  );
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
//export const bearerAuth = (token) => ({bearer: token});
