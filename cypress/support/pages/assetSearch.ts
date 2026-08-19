import { AssetId } from '@asset-sg/shared/v2';
import { interceptAsset, interceptAssetSearch, waitForSuccess } from '../api';
import { byTestId, getByTestId } from '../testId';

/**
 * Page object for the asset search and the asset detail panel.
 *
 * All accessors re-query the DOM on every call instead of relying on `cy.get('@alias')`.
 * Aliased DOM elements are shared mutable state across steps and specs: they go stale
 * whenever Angular re-renders or the page reloads, which produces "detached from DOM"
 * failures that are hard to reproduce.
 */

export const getAssetDetail = (): Cypress.Chainable<JQuery<HTMLElement>> => cy.get('asset-sg-asset-search-detail');

export const getAssetDetailScrollContainer = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  getAssetDetail().find(byTestId('assetDetailScroll'));

export const scrollAssetDetailToBottom = (): void => {
  getAssetDetailScrollContainer().scrollTo('bottom', { ensureScrollable: false });
};

/**
 * Searches for an asset by its id and waits for the results to be updated.
 */
export const searchAssetById = (assetId: AssetId): void => {
  const searchAlias = interceptAssetSearch();

  getByTestId('searchInput').should('be.visible').clear().type(`id:${assetId}{enter}`);

  waitForSuccess(searchAlias);
};

/**
 * Searches for an asset by its id and opens its detail panel.
 */
export const searchAndSelectAssetById = (assetId: AssetId): void => {
  const assetAlias = interceptAsset(assetId);

  searchAssetById(assetId);

  // Target the row of the expected asset directly. Asserting on the number of rows instead
  // makes the test depend on unrelated fixture data and gives useless failure messages.
  getByTestId(`asset-row-${assetId}`).should('be.visible').click();

  waitForSuccess(assetAlias);
  getAssetDetail().should('be.visible');
};

export const getViewerFile = (fileId: number): Cypress.Chainable<JQuery<HTMLElement>> =>
  getByTestId('assetNormalFiles').find(byTestId(`file-${fileId}`));

const EDITOR_URL_SEGMENT = '/asset-admin/';

/**
 * Opens the editor of the currently selected asset.
 *
 * The edit button is rendered inside an `@if (canUpdate$ | async)`, whose source derives from
 * `asset$`, and inside an `*rxLet` for the current language. Both of these render
 * asynchronously, so the button can be torn down and rebuilt, or can still be bound to an
 * unresolved language, at the moment it is clicked. The click is then delivered to an element
 * that no longer triggers the navigation, and the application simply stays where it is.
 *
 * Cypress cannot detect this: the element is attached and visible, and the click itself
 * succeeds. Confirm that the editor route was entered and click again if it was not.
 */
export const openAssetEditor = (): void => {
  clickEditButtonUntilEditorOpens(2);
};

const clickEditButtonUntilEditorOpens = (remainingAttempts: number): void => {
  getAssetDetail().find(byTestId('edit-asset-button')).should('be.visible').click();

  waitForEditorRoute(10_000).then((hasOpened) => {
    if (hasOpened) {
      return;
    }
    if (remainingAttempts <= 0) {
      throw new Error(
        'Clicking the edit button did not open the asset editor. The application stayed on the search page.',
      );
    }
    cy.log('The edit button click was not acted upon, clicking again.');
    clickEditButtonUntilEditorOpens(remainingAttempts - 1);
  });
};

/**
 * Resolves to whether the editor route was entered within the given time.
 *
 * Unlike an assertion, this reports the outcome instead of failing on it, so that the caller
 * can react to a click that was swallowed.
 */
const waitForEditorRoute = (timeout: number): Cypress.Chainable<boolean> => {
  const startedAt = Date.now();
  const check = (): Cypress.Chainable<boolean> =>
    cy.location('pathname', { log: false }).then((pathname) => {
      if (pathname.includes(EDITOR_URL_SEGMENT)) {
        return cy.wrap(true, { log: false });
      }
      if (Date.now() - startedAt > timeout) {
        return cy.wrap(false, { log: false });
      }
      return cy.wait(250, { log: false }).then(check);
    });
  return check();
};
