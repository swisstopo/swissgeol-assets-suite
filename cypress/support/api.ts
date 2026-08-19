import { AssetFile, AssetFileId, AssetId } from '@asset-sg/shared/v2';

/**
 * Helpers that register network interceptions and return their alias.
 *
 * Always register an interception _before_ triggering the action that causes the request.
 * Registering it afterwards is a race: if the response arrives first, the following
 * `cy.wait(...)` hangs until it times out.
 *
 * Waiting on a request is also the only reliable way to know that the application has
 * caught up. Never replace it with a fixed `cy.wait(<milliseconds>)`, which is both slower
 * than necessary and still too short on a loaded CI machine.
 */

export const interceptAssetSearch = (): string => {
  cy.intercept('POST', '/api/assets/search*').as('assetSearch');
  return '@assetSearch';
};

export const interceptAsset = (assetId: AssetId): string => {
  cy.intercept('GET', `/api/assets/${assetId}`).as('asset');
  return '@asset';
};

export const interceptAssetUpdate = (assetId: AssetId): string => {
  cy.intercept('PUT', `/api/assets/${assetId}`).as('assetUpdate');
  return '@assetUpdate';
};

export const interceptUserUpdate = (userId: string): string => {
  cy.intercept('PUT', `/api/users/${userId}`).as('userUpdate');
  return '@userUpdate';
};

/**
 * Waits for an intercepted request and asserts that it did not fail.
 *
 * Any non-error status is accepted on purpose: the application legitimately answers with
 * `304 Not Modified` for cached resources, and pinning an exact status turns a harmless
 * caching detail into a test failure.
 */
export const waitForSuccess = (alias: string): void => {
  cy.wait(alias).its('response.statusCode').should('be.lessThan', 400);
};

/**
 * Reads a file's persisted state straight from the API.
 *
 * Page classifications are produced by the OCR and data extraction services, so their exact
 * shape depends on the version of those services. Asserting the user interface against the
 * hard-coded fixture therefore fails whenever those services change, even though nothing is
 * actually wrong with the application. `fixtures:create` already reports such a drift.
 *
 * These tests verify that the application _displays_ what the API returns, so they read the
 * expected values from the API instead of from the fixture.
 */
export const fetchAssetFile = (assetId: AssetId, fileId: AssetFileId): Cypress.Chainable<AssetFile> =>
  cy.window({ log: false }).then((win) => {
    const token = win.sessionStorage.getItem('access_token');
    return cy
      .request<AssetFile[]>({
        method: 'GET',
        url: `/api/assets/${assetId}/files`,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const file = response.body.find((it) => it.id === fileId);
        if (file == null) {
          throw new Error(`File ${fileId} does not exist on asset ${assetId}.`);
        }
        return file;
      });
  });
