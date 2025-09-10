import { fixtures } from '@asset-sg/shared/v2';
import { Given } from '@badeball/cypress-cucumber-preprocessor';

export const waitForExternalNavigation = () =>
  cy.window().then((window) =>
    cy.waitUntil(() => {
      // Wait until accessing the window fails, as that indicates that the window context has switched.
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        window.location.href;
        return false;
      } catch {
        return true;
      }
    }),
  );

Given(
  /^the application has been accessed as "(admin|publisher|reviewer|editor|reader)"$/,
  (username: keyof typeof fixtures.users) => {
    const user = fixtures.users[username];
    cy.session(
      user.email,
      () => {
        cy.visit('/?lang=en');
        waitForExternalNavigation();

        cy.origin('http://localhost:4011', { args: { username } }, ({ username }) => {
          cy.get('#Input_Username').type(username);
          cy.get('#Input_Password').type(username);
          cy.get('[name="Input.Button"][value="login"]').click();
        });

        cy.intercept('http://localhost:4011/connect/token').as('token');

        cy.wait('@token')
          .then((interception) => interception?.response?.body.access_token)
          .then((token) => globalThis.localStorage.setItem('access_token', token));
      },
      {
        cacheAcrossSpecs: true,
      },
    );
    cy.visit('/');
  },
);
