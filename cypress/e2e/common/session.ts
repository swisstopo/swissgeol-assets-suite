import { fixtures } from '@asset-sg/shared/v2';
import { Given } from '@badeball/cypress-cucumber-preprocessor';

export const APP_URL = 'http://localhost:4200';
export const IDENTITY_URL = 'http://localhost:4011';

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

/**
 * Signs in through the external identity provider.
 *
 * The application stores its access token in `sessionStorage` (see `SessionStorageService`),
 * and the HTTP interceptor drops every API request while that token is missing. Waiting for
 * the token is therefore the only reliable signal that the application is ready to be used.
 */
export const signIn = (username: keyof typeof fixtures.users): void => {
  const user = fixtures.users[username];

  cy.session(
    user.email,
    () => {
      // The interception has to be registered before the sign in is triggered.
      // Registering it afterwards races the response and makes `cy.wait` time out.
      cy.intercept('POST', `${IDENTITY_URL}/connect/token`).as('token');

      cy.visit('/?lang=en');
      waitForExternalNavigation();

      cy.origin(IDENTITY_URL, { args: { username } }, ({ username }) => {
        cy.get('#Input_Username').should('be.visible').type(username);
        cy.get('#Input_Password').should('be.visible').type(username);
        cy.get('[name="Input.Button"][value="login"]').click();
      });

      cy.wait('@token').its('response.statusCode').should('be.lessThan', 400);

      // Wait for the redirect back to the application before asserting on its storage,
      // as the token is only persisted once the application has taken over again.
      cy.url({ timeout: 30_000 }).should('include', APP_URL);
      cy.window().its('sessionStorage.access_token').should('be.a', 'string');
    },
    {
      cacheAcrossSpecs: true,
      // Without a validation the suite silently reuses a session whose token has been
      // dropped or has expired, which surfaces much later as unrelated request failures.
      validate: () => {
        cy.window().its('sessionStorage.access_token').should('be.a', 'string');
      },
    },
  );

  cy.visit('/');
  cy.window().its('sessionStorage.access_token').should('be.a', 'string');
};

Given(
  /^the application has been accessed as "(admin|publisher|reviewer|editor|reader)"$/,
  (username: keyof typeof fixtures.users) => {
    signIn(username);
  },
);
