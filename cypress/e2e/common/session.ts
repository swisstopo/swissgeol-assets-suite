import { fixtures } from '@asset-sg/shared/v2';
import { Given } from '@badeball/cypress-cucumber-preprocessor';

export const APP_URL = 'http://localhost:4200';
export const IDENTITY_URL = 'http://localhost:4011';

// `AuthService.configureOAuth` passes on an `OAuthConfig`, which carries neither
// `clockSkewInSec` nor `decreaseExpirationBySec`. The defaults of `angular-oauth2-oidc`
// therefore apply: the expiration is not decreased, and a token counts as valid until ten
// minutes past its expiration.
const CLOCK_SKEW_IN_MS = 600_000;

/**
 * Reports whether the session storage holds an access token that the application would
 * accept, mirroring `OAuthService.hasValidAccessToken`.
 *
 * The library keeps the expiration in `expires_at`, next to the token itself, so this needs
 * nothing but the storage that `cy.session` has restored. A token without an expiration
 * counts as valid, which is what the library does as well.
 */
const hasValidAccessToken = (storage: Storage): boolean => {
  const accessToken = storage.getItem('access_token');
  if (!accessToken) {
    return false;
  }
  const expiresAt = storage.getItem('expires_at');
  if (!expiresAt) {
    return true;
  }
  // An unparsable expiration yields `NaN`, which compares false and therefore counts as
  // valid, again matching the library.
  return Number.parseInt(expiresAt, 10) >= Date.now() - CLOCK_SKEW_IN_MS;
};

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
      // A restored session is only useful while its access token is one that the application
      // accepts. The HTTP interceptor drops every API request once the token is missing, and
      // logs the user out once it has expired, which surfaces much later as unrelated
      // failures. Checking the token here instead makes cypress run the sign in again.
      //
      // This reads the same session storage entries as the application, so it catches a
      // token that was never restored as well as one that has expired. It does not verify
      // the token against the identity provider or the api.
      validate: () => {
        cy.window({ log: false }).should((win) => {
          expect(hasValidAccessToken(win.sessionStorage), 'cached session has a valid access token').to.equal(true);
        });
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
